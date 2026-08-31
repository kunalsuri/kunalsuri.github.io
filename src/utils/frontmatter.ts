/**
 * YAML frontmatter parser & stringifier for Astro's blog post schema,
 * built on js-yaml rather than hand-rolled regex parsing so it correctly
 * handles titles with colons/quotes, multi-line values, and real arrays.
 */
import { load, dump, JSON_SCHEMA } from 'js-yaml';

export interface BlogFrontmatter {
  title: string;
  description: string;
  pubDate: string; // YYYY-MM-DD format
  updatedDate?: string;
  category: string;
  tags: string[];
  draft: boolean;
  /** Series display name, e.g. "What Is". Absent for standalone posts. */
  series?: string;
  /** Explicit reading-order position within the series. */
  seriesOrder?: number;
}

export interface ParsedMarkdown {
  frontmatter: BlogFrontmatter;
  content: string;
}

const FRONTMATTER_BLOCK = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

/** Used when a file has no frontmatter block at all, or it fails to parse —
 * defaults to draft so an unreadable file doesn't silently go live. */
function fallbackFrontmatter(): BlogFrontmatter {
  return {
    title: 'Untitled',
    description: '',
    pubDate: todayIso(),
    category: 'Notes',
    tags: [],
    draft: true,
  };
}

function asString(value: unknown, fallback: string): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

/** js-yaml's JSON_SCHEMA never auto-resolves dates, but stays defensive in
 * case a value ever arrives as a real Date (e.g. hand-edited under a
 * different schema elsewhere). */
/** Series order is a positive integer or nothing — a 0, a float, or a
 * non-numeric string is dropped rather than written back out as invalid
 * front-matter that would fail the Astro build. */
function asSeriesOrder(value: unknown): number | undefined {
  const parsed = typeof value === 'string' ? Number(value.trim()) : value;
  if (typeof parsed !== 'number' || !Number.isInteger(parsed) || parsed < 1) {
    return undefined;
  }
  return parsed;
}

function asDate(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (value instanceof Date) return value.toISOString().split('T')[0];
  return undefined;
}

/**
 * Parses raw .md file content containing YAML frontmatter bounded by ---.
 */
export function parseFrontmatter(fileContent: string): ParsedMarkdown {
  const trimmed = fileContent.trimStart();
  if (!trimmed.startsWith('---')) {
    return { frontmatter: fallbackFrontmatter(), content: fileContent };
  }

  const match = trimmed.match(FRONTMATTER_BLOCK);
  if (!match) {
    return { frontmatter: fallbackFrontmatter(), content: fileContent };
  }

  const [, yamlBlock, body] = match;

  let parsed: unknown;
  try {
    // JSON_SCHEMA has no timestamp resolver, so an unquoted `pubDate:
    // 2026-07-08` stays a plain string instead of silently becoming a
    // native Date object (which would break the <input type="date"> and
    // every plain-string consumer of BlogFrontmatter.pubDate).
    parsed = load(yamlBlock, { schema: JSON_SCHEMA });
  } catch {
    return { frontmatter: fallbackFrontmatter(), content: body || '' };
  }

  const record = (parsed && typeof parsed === 'object' ? parsed : {}) as Record<string, unknown>;
  const defaults = fallbackFrontmatter();

  const frontmatter: BlogFrontmatter = {
    title: asString(record.title, defaults.title),
    description: asString(record.description, defaults.description),
    pubDate: asDate(record.pubDate) ?? defaults.pubDate,
    category: asString(record.category, defaults.category),
    tags: Array.isArray(record.tags) ? record.tags.filter((t): t is string => typeof t === 'string') : defaults.tags,
    // A frontmatter block that simply omits `draft` defaults to published
    // (false), matching content.config.ts's own Zod default — only the
    // "couldn't parse this file at all" fallback above defaults to true.
    draft: typeof record.draft === 'boolean' ? record.draft : false,
  };

  const updatedDate = asDate(record.updatedDate);
  if (updatedDate) {
    frontmatter.updatedDate = updatedDate;
  }

  const series = typeof record.series === 'string' ? record.series.trim() : '';
  if (series) {
    frontmatter.series = series;
    const seriesOrder = asSeriesOrder(record.seriesOrder);
    // seriesOrder without a series is meaningless, so it only survives
    // alongside one.
    if (seriesOrder !== undefined) {
      frontmatter.seriesOrder = seriesOrder;
    }
  }

  return { frontmatter, content: body || '' };
}

/**
 * Stringifies a frontmatter object and markdown content into a clean Astro .md file string.
 */
export function stringifyFrontmatter(frontmatter: Partial<BlogFrontmatter>, content: string): string {
  const record: Record<string, unknown> = {
    title: frontmatter.title || 'Untitled Post',
    description: frontmatter.description || '',
    pubDate: frontmatter.pubDate || todayIso(),
  };
  if (frontmatter.updatedDate) {
    record.updatedDate = frontmatter.updatedDate;
  }
  record.category = frontmatter.category || 'Notes';
  record.tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
  record.draft = Boolean(frontmatter.draft);

  const series = typeof frontmatter.series === 'string' ? frontmatter.series.trim() : '';
  if (series) {
    record.series = series;
    const seriesOrder = asSeriesOrder(frontmatter.seriesOrder);
    if (seriesOrder !== undefined) {
      record.seriesOrder = seriesOrder;
    }
  }

  const yaml = dump(record, {
    sortKeys: false, // preserve insertion order above (title, description, pubDate, ...)
    quotingType: '"',
    forceQuotes: true, // quote every string scalar — unambiguous, avoids YAML's implicit-typing footguns
    flowLevel: 1, // keep the root block-style (one `key: value` per line) but render nested arrays like tags inline
    lineWidth: -1, // never hard-wrap long descriptions mid-string
  });

  const cleanContent = content.trim();
  return `---\n${yaml}---\n\n${cleanContent}\n`;
}
