import { getPublishedPosts, type Post } from './posts';

/** URL-safe slug for a tag or category name ("Astro & Web" -> "astro-web"). */
export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\w]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface TaxItem {
  name: string;
  slug: string;
  count: number;
}

function tally(values: Array<{ name: string }>): TaxItem[] {
  const map = new Map<string, TaxItem>();
  for (const { name } of values) {
    const slug = slugify(name);
    const found = map.get(slug);
    if (found) found.count += 1;
    else map.set(slug, { name, slug, count: 1 });
  }
  // Most-used first, then alphabetical — a stable, useful order for an index.
  return [...map.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  );
}

export async function getTags(): Promise<TaxItem[]> {
  const posts = await getPublishedPosts();
  return tally(posts.flatMap((p) => p.data.tags.map((name) => ({ name }))));
}

export async function getCategories(): Promise<TaxItem[]> {
  const posts = await getPublishedPosts();
  return tally(posts.map((p) => ({ name: p.data.category })));
}

export async function getPostsByTag(slug: string): Promise<Post[]> {
  const posts = await getPublishedPosts();
  return posts.filter((p) => p.data.tags.some((t) => slugify(t) === slug));
}

export async function getPostsByCategory(slug: string): Promise<Post[]> {
  const posts = await getPublishedPosts();
  return posts.filter((p) => slugify(p.data.category) === slug);
}
