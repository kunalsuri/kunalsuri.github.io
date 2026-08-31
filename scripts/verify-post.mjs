#!/usr/bin/env node
/**
 * Mechanical pre-publish gate for blog posts.
 *
 * This is the half of verification that does not need judgement: schema
 * shape, house-style structure, length, leftover placeholders. The factual
 * half — is this claim actually true, does this number still hold — is a
 * human/agent review step and deliberately lives outside this script. See
 * docs/series/what-is-playbook.md §6.
 *
 * Usage:
 *   node scripts/verify-post.mjs <slug>      # one post
 *   node scripts/verify-post.mjs --all       # every post
 *   node scripts/verify-post.mjs --series "What Is"
 *
 * Exits non-zero if any post has errors, so it works as a CI gate too.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load, JSON_SCHEMA } from 'js-yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BLOG_DIR = path.join(ROOT, 'src/content/blog');
const REVIEWS_DIR = path.join(ROOT, 'docs/series/reviews');

/** Structural rules for the "What Is" series, from the playbook. */
export const WHAT_IS_RULES = {
  series: 'What Is',
  titlePattern: /^What is .+\?$/i,
  slugPrefix: 'what-is-',
  // No floor. If a term can be explained clearly in 300 words, that is the
  // series working, not failing. Only the ceiling is worth a nudge, and it is
  // a warning rather than an error.
  softMaxWords: 1200,
  requiredHeadings: [
    'The short answer',
    'Why it exists',
    'How it actually works',
    'What it is not',
    'Where it breaks',
    'The one-line version',
  ],
};

const PLACEHOLDER_MARKERS = /\b(TODO|TKTK|FIXME|XXX)\b|\[\?\]/g;
const PLACEHOLDER_LINKS = /\]\(\s*(#\s*|https?:\/\/(www\.)?example\.(com|org)[^)]*)\)/g;
const MAX_DESCRIPTION = 160;

/** Split a raw .md file into front-matter object + body. */
function splitPost(raw) {
  const match = raw.replace(/^﻿/, '').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { frontmatter: null, body: raw };
  try {
    // JSON_SCHEMA keeps `pubDate: 2026-08-31` a string rather than silently
    // resolving it to a Date, matching src/utils/frontmatter.ts.
    const frontmatter = load(match[1], { schema: JSON_SCHEMA });
    return { frontmatter: frontmatter ?? {}, body: match[2] ?? '' };
  } catch (err) {
    return { frontmatter: null, body: match[2] ?? '', yamlError: err.message };
  }
}

/** Words in the prose body, excluding fenced code blocks and headings. */
function countWords(body) {
  const prose = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#{1,6} .*$/gm, ' ')
    .replace(/[#*_>`|-]/g, ' ');
  return prose.split(/\s+/).filter(Boolean).length;
}

/**
 * Where a post sits in the pipeline, derived entirely from what is on disk.
 * Nothing tracks this in a second place, so nothing can drift out of sync:
 *   idea      — no post file yet (only ever reported for a slug you asked for)
 *   draft     — draft: true, no review report
 *   verified  — draft: true, review report exists
 *   published — draft: false
 */
export function stageOf(post) {
  if (!post) return 'idea';
  if (post.frontmatter?.draft !== true) return 'published';
  return fs.existsSync(path.join(REVIEWS_DIR, `${post.slug}.md`)) ? 'verified' : 'draft';
}

/** The single next action for a post at a given stage. */
export function nextAction(stage, slug) {
  switch (stage) {
    case 'idea':
      return `no draft yet — run /what-is ${slug || '<topic>'} to write one`;
    case 'draft':
      return `drafted but unverified — run /what-is ${slug} to fact-check it`;
    case 'verified':
      return `verified and awaiting your OK — run /what-is ${slug} to publish`;
    default:
      return 'published — nothing to do';
  }
}

/** Every post on disk, as { slug, file, frontmatter, body }. */
export function collectPosts() {
  if (!fs.existsSync(BLOG_DIR)) return [];
  const posts = [];

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.(md|mdx)$/.test(entry.name)) {
        const rel = path.relative(BLOG_DIR, full).replace(/\\/g, '/');
        const parts = rel.replace(/\.(md|mdx)$/, '').split('/');
        const base = parts[parts.length - 1];
        const parent = parts[parts.length - 2];
        const slug = base === 'index' && parent ? parent : base;
        const raw = fs.readFileSync(full, 'utf-8');
        posts.push({ slug, file: rel, ...splitPost(raw) });
      }
    }
  };

  walk(BLOG_DIR);
  return posts;
}

/**
 * Check one post. `siblings` is the full post list, used only for
 * cross-post checks (duplicate seriesOrder).
 * Returns { slug, errors, warnings }.
 */
export function verifyPost(post, siblings = []) {
  const errors = [];
  const warnings = [];
  const fm = post.frontmatter;

  if (!fm) {
    errors.push(
      post.yamlError
        ? `front-matter is not valid YAML: ${post.yamlError}`
        : 'no YAML front-matter block found',
    );
    return { slug: post.slug, file: post.file, errors, warnings };
  }

  // --- Schema shape (mirrors src/content.config.ts) ---
  for (const field of ['title', 'description', 'pubDate']) {
    if (!fm[field] || String(fm[field]).trim() === '') {
      errors.push(`missing required front-matter field: ${field}`);
    }
  }
  if (fm.pubDate && Number.isNaN(new Date(fm.pubDate).getTime())) {
    errors.push(`pubDate is not a valid date: ${fm.pubDate}`);
  }
  if (fm.tags !== undefined && !Array.isArray(fm.tags)) {
    errors.push('tags must be an array');
  }
  if (fm.draft !== undefined && typeof fm.draft !== 'boolean') {
    errors.push('draft must be a boolean');
  }
  if (typeof fm.description === 'string' && fm.description.length > MAX_DESCRIPTION) {
    errors.push(
      `description is ${fm.description.length} chars; keep it under ${MAX_DESCRIPTION} so it survives search and social previews`,
    );
  }

  // --- Series integrity (applies to every series, not just What Is) ---
  if (fm.seriesOrder !== undefined) {
    if (!fm.series) {
      errors.push('seriesOrder is set but series is not — seriesOrder alone means nothing');
    }
    if (!Number.isInteger(fm.seriesOrder) || fm.seriesOrder < 1) {
      errors.push(`seriesOrder must be a positive integer, got: ${fm.seriesOrder}`);
    } else {
      const clash = siblings.find(
        (other) =>
          other.slug !== post.slug &&
          other.frontmatter?.series === fm.series &&
          other.frontmatter?.seriesOrder === fm.seriesOrder,
      );
      if (clash) {
        errors.push(
          `seriesOrder ${fm.seriesOrder} is already used by "${clash.slug}" in the "${fm.series}" series`,
        );
      }
    }
  }
  if (fm.series && String(fm.series).trim() === String(fm.category ?? '').trim()) {
    warnings.push(
      'series and category are identical — they are meant to be orthogonal (category = section, series = thread)',
    );
  }

  // --- Body hygiene (every post) ---
  const body = post.body ?? '';
  const markers = [...body.matchAll(PLACEHOLDER_MARKERS)].map((m) => m[0]);
  if (markers.length > 0) {
    errors.push(`unresolved placeholder marker(s): ${[...new Set(markers)].join(', ')}`);
  }
  const deadLinks = [...body.matchAll(PLACEHOLDER_LINKS)].map((m) => m[0]);
  if (deadLinks.length > 0) {
    errors.push(`placeholder link(s) left in the body: ${[...new Set(deadLinks)].join(', ')}`);
  }

  // --- What Is house style ---
  if (fm.series === WHAT_IS_RULES.series) {
    const title = String(fm.title ?? '');
    if (!WHAT_IS_RULES.titlePattern.test(title)) {
      errors.push(`title must read "What is <thing>?" (question mark included), got: "${title}"`);
    }
    if (!post.slug.startsWith(WHAT_IS_RULES.slugPrefix)) {
      errors.push(`slug must start with "${WHAT_IS_RULES.slugPrefix}", got: "${post.slug}"`);
    }

    const headings = [...body.matchAll(/^##\s+(.+?)\s*$/gm)].map((m) => m[1].trim());
    for (const required of WHAT_IS_RULES.requiredHeadings) {
      if (!headings.some((h) => h.toLowerCase() === required.toLowerCase())) {
        errors.push(`missing required section: "## ${required}"`);
      }
    }

    const words = countWords(body);
    if (words > WHAT_IS_RULES.softMaxWords) {
      warnings.push(
        `${words} words — over the ${WHAT_IS_RULES.softMaxWords}-word ceiling; consider whether this is an essay rather than a What Is post`,
      );
    }
  }

  if (fm.draft === true) {
    warnings.push('still marked draft: true — it will not appear in the production build');
  }

  return { slug: post.slug, file: post.file, errors, warnings };
}

// --- CLI ---------------------------------------------------------------

/** `--stage` prints where every series post sits, derived from disk alone. */
function printStages(posts) {
  const series = posts
    .filter((p) => p.frontmatter?.series)
    .sort((a, b) => String(a.slug).localeCompare(String(b.slug)));

  if (series.length === 0) {
    console.log('\nNo series posts yet.\n');
    return 0;
  }

  console.log('');
  for (const post of series) {
    const stage = stageOf(post);
    console.log(`  ${stage.padEnd(9)} ${post.slug}`);
    console.log(`            -> ${nextAction(stage, post.slug)}`);
  }
  console.log('');
  return 0;
}

function main(argv) {
  const posts = collectPosts();

  if (argv.includes('--stage')) {
    return printStages(posts);
  }
  let targets = posts;
  let label = 'all posts';

  const seriesFlag = argv.indexOf('--series');
  if (argv.includes('--all')) {
    // default: everything
  } else if (seriesFlag !== -1) {
    const name = argv[seriesFlag + 1];
    if (!name) {
      console.error('--series needs a name, e.g. --series "What Is"');
      return 2;
    }
    targets = posts.filter((p) => p.frontmatter?.series === name);
    label = `series "${name}"`;
  } else {
    const slug = argv.find((a) => !a.startsWith('-'));
    if (!slug) {
      console.error('Usage: node scripts/verify-post.mjs <slug> | --all | --series "<name>"');
      return 2;
    }
    targets = posts.filter((p) => p.slug === slug);
    label = `post "${slug}"`;
    if (targets.length === 0) {
      console.error(`No post found with slug "${slug}" in src/content/blog/`);
      return 1;
    }
  }

  if (targets.length === 0) {
    console.log(`No posts matched ${label}. Nothing to check.`);
    return 0;
  }

  let failed = 0;
  console.log(`\nVerifying ${label} (${targets.length} post${targets.length === 1 ? '' : 's'})\n`);

  for (const post of targets) {
    const { errors, warnings } = verifyPost(post, posts);
    const mark = errors.length === 0 ? (warnings.length === 0 ? 'PASS' : 'PASS*') : 'FAIL';
    console.log(`  [${mark}] ${post.slug}  (${stageOf(post)})`);
    for (const e of errors) console.log(`      error:   ${e}`);
    for (const w of warnings) console.log(`      warning: ${w}`);
    if (errors.length > 0) failed += 1;
  }

  console.log('');
  if (failed > 0) {
    console.log(`${failed} post${failed === 1 ? '' : 's'} failed the mechanical gate.\n`);
    return 1;
  }
  console.log('Mechanical gate passed. Factual review is still yours — see');
  console.log('docs/series/what-is-playbook.md §6.\n');
  return 0;
}

// Only run the CLI when invoked directly, so tests can import the checks.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
