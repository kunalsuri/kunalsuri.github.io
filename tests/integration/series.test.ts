import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ensureDistBuilt } from './ensure-build';
// Plain .mjs script — deliberately untyped, shared with the CLI gate.
import { collectPosts, verifyPost } from '../../scripts/verify-post.mjs';

const DIST_DIR = path.resolve('dist');

interface CheckedPost {
  slug: string;
  file: string;
  frontmatter: Record<string, unknown> | null;
  body: string;
}

const posts = collectPosts() as CheckedPost[];
const seriesPosts = posts.filter((p) => p.frontmatter?.series);
const publishedSeriesPosts = seriesPosts.filter((p) => p.frontmatter?.draft !== true);

beforeAll(() => {
  ensureDistBuilt();
}, 120_000);

/**
 * The mechanical publish gate, run against the posts that actually exist in
 * this repo. scripts/verify-post.mjs is the same code the /what-is-verify
 * workflow and `npm run verify:post` call, so a draft that would embarrass us
 * fails CI rather than only failing a human's attention.
 */
describe('Real posts pass the mechanical publish gate', () => {
  it('has at least one post to check', () => {
    expect(posts.length).toBeGreaterThan(0);
  });

  describe.each(posts.map((p) => [p.slug, p] as const))('post: %s', (_slug, post) => {
    it('reports no errors from verify-post', () => {
      const { errors } = verifyPost(post, posts) as { errors: string[] };
      expect(errors).toEqual([]);
    });
  });
});

describe('Series front-matter integrity', () => {
  it('never sets seriesOrder without a series', () => {
    const orphans = posts.filter(
      (p) => p.frontmatter?.seriesOrder !== undefined && !p.frontmatter?.series,
    );
    expect(orphans.map((p) => p.slug)).toEqual([]);
  });

  it('keeps seriesOrder unique within each series', () => {
    const seen = new Map<string, string>();
    const clashes: string[] = [];
    for (const post of seriesPosts) {
      const order = post.frontmatter?.seriesOrder;
      if (order === undefined) continue;
      const key = `${post.frontmatter?.series}#${order}`;
      if (seen.has(key)) clashes.push(`${key} used by ${seen.get(key)} and ${post.slug}`);
      else seen.set(key, post.slug);
    }
    expect(clashes).toEqual([]);
  });

  it('never reuses the category value as the series value', () => {
    // They are orthogonal by design: category is the section, series is the
    // thread. Collapsing them silently breaks both taxonomies.
    const collapsed = seriesPosts.filter((p) => p.frontmatter?.series === p.frontmatter?.category);
    expect(collapsed.map((p) => p.slug)).toEqual([]);
  });
});

describe('Series routes in the production build', () => {
  it('renders the /series index page', () => {
    expect(fs.existsSync(path.join(DIST_DIR, 'series', 'index.html'))).toBe(true);
  });

  it('links the series index from the site navigation', () => {
    const home = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf-8');
    expect(home).toContain('href="/series"');
  });

  it.runIf(publishedSeriesPosts.length > 0)(
    'renders a page for every published series',
    () => {
      const slugs = new Set(
        publishedSeriesPosts.map((p) =>
          String(p.frontmatter?.series)
            .trim()
            .toLowerCase()
            .replace(/[^\w]+/g, '-')
            .replace(/^-+|-+$/g, ''),
        ),
      );
      for (const slug of slugs) {
        expect(
          fs.existsSync(path.join(DIST_DIR, 'series', slug, 'index.html')),
          `expected dist/series/${slug}/index.html`,
        ).toBe(true);
      }
    },
  );

  it.runIf(publishedSeriesPosts.length > 0)(
    'lists published series in llms.txt under a Series heading',
    () => {
      const llms = fs.readFileSync(path.join(DIST_DIR, 'llms.txt'), 'utf-8');
      expect(llms).toContain('## Series');
    },
  );

  it('keeps draft series posts out of the production build', () => {
    const drafts = seriesPosts.filter((p) => p.frontmatter?.draft === true);
    for (const draft of drafts) {
      expect(
        fs.existsSync(path.join(DIST_DIR, 'blog', draft.slug, 'index.html')),
        `draft ${draft.slug} must not be built`,
      ).toBe(false);
    }
  });
});
