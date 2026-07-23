import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

/**
 * The single source of truth for "which posts does the world see, and in what
 * order." Home, /blog, and the RSS feed all call this, so they can never drift
 * out of sync.
 *
 * DESIGN DECISION (yours to tune):
 *   - Drafts (`draft: true`) are hidden in production builds but visible during
 *     `astro dev`, so you can preview work-in-progress locally.
 *   - Posts are sorted newest-first by `pubDate`.
 *
 * Want featured/pinned posts, sorting by updatedDate, or showing drafts with a
 * banner instead? This is the one function to change.
 */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) =>
    import.meta.env.PROD ? data.draft !== true : true,
  );

  return posts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
}
