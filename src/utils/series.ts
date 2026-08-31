import { getPublishedPosts, type Post } from './posts';
import { slugify } from './taxonomy';
import { SERIES_META } from '../consts';

/**
 * A series is an ordered run of posts sharing a spine — "What Is", say —
 * and it is deliberately orthogonal to `category`. A post is filed under one
 * category (its section) and may *also* belong to one series, so "What is an
 * LLM?" can sit in Engineering and still read as episode 3 of What Is.
 *
 * Two ordering rules matter here and differ from the rest of the site:
 *   - Within a series, posts are sorted OLDEST-first. A series has a reading
 *     order; the blog index has a recency order. They are not the same thing.
 *   - An explicit `seriesOrder` always wins over pubDate, so you can insert a
 *     prerequisite post later without re-dating everything around it.
 */

export interface SeriesSummary {
  /** Display name exactly as written in front-matter, e.g. "What Is". */
  name: string;
  /** URL-safe slug used by /series/[series]. */
  slug: string;
  /** Optional editorial blurb from SERIES_META in consts.ts. */
  description?: string;
  count: number;
  /** Newest pubDate in the series — used to sort the series index. */
  latest: Date;
}

/** A post's place inside its series, for the in-article navigation box. */
export interface SeriesContext {
  name: string;
  slug: string;
  description?: string;
  /** 1-based position in reading order. */
  position: number;
  total: number;
  /** Every post in the series, in reading order, for the "jump to" list. */
  entries: Array<{ id: string; title: string; isCurrent: boolean }>;
  prev?: { id: string; title: string };
  next?: { id: string; title: string };
}

/** Reading order: explicit `seriesOrder` first, then oldest pubDate first. */
function byReadingOrder(a: Post, b: Post): number {
  const orderA = a.data.seriesOrder;
  const orderB = b.data.seriesOrder;

  if (orderA !== undefined && orderB !== undefined) return orderA - orderB;
  // A numbered post always sorts ahead of an unnumbered one, so a partially
  // numbered series still renders in a stable, predictable order.
  if (orderA !== undefined) return -1;
  if (orderB !== undefined) return 1;

  return a.data.pubDate.valueOf() - b.data.pubDate.valueOf();
}

function seriesDescription(slug: string): string | undefined {
  return SERIES_META[slug]?.description;
}

/** Every series that has at least one published post, most recent first. */
export async function getAllSeries(): Promise<SeriesSummary[]> {
  const posts = await getPublishedPosts();
  const map = new Map<string, SeriesSummary>();

  for (const post of posts) {
    const name = post.data.series;
    if (!name) continue;

    const slug = slugify(name);
    const found = map.get(slug);

    if (found) {
      found.count += 1;
      if (post.data.pubDate > found.latest) found.latest = post.data.pubDate;
    } else {
      map.set(slug, {
        name,
        slug,
        description: seriesDescription(slug),
        count: 1,
        latest: post.data.pubDate,
      });
    }
  }

  return [...map.values()].sort(
    (a, b) => b.latest.valueOf() - a.latest.valueOf() || a.name.localeCompare(b.name),
  );
}

/** All posts in one series, in reading order. */
export async function getPostsBySeries(slug: string): Promise<Post[]> {
  const posts = await getPublishedPosts();
  return posts
    .filter((p) => p.data.series && slugify(p.data.series) === slug)
    .sort(byReadingOrder);
}

/**
 * Where a given post sits in its series. Returns undefined for standalone
 * posts and for a series of one — a "Part 1 of 1" banner is noise, not
 * navigation.
 */
export async function getSeriesContext(postId: string): Promise<SeriesContext | undefined> {
  const posts = await getPublishedPosts();
  const current = posts.find((p) => p.id === postId);
  const name = current?.data.series;
  if (!current || !name) return undefined;

  const slug = slugify(name);
  const siblings = posts
    .filter((p) => p.data.series && slugify(p.data.series) === slug)
    .sort(byReadingOrder);

  if (siblings.length < 2) return undefined;

  const index = siblings.findIndex((p) => p.id === current.id);
  const prev = siblings[index - 1];
  const next = siblings[index + 1];

  return {
    name,
    slug,
    description: seriesDescription(slug),
    position: index + 1,
    total: siblings.length,
    entries: siblings.map((p) => ({
      id: p.id,
      title: p.data.title,
      isCurrent: p.id === current.id,
    })),
    ...(prev && { prev: { id: prev.id, title: prev.data.title } }),
    ...(next && { next: { id: next.id, title: next.data.title } }),
  };
}
