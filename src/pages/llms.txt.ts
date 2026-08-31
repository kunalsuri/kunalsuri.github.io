import type { APIRoute } from 'astro';
import { getPublishedPosts } from '../utils/posts';
import { getAllSeries, getPostsBySeries } from '../utils/series';
import { SITE_TITLE, SITE_DESCRIPTION, SITE_URL, AUTHOR, SITE_TAGLINE } from '../consts';

export const GET: APIRoute = async () => {
  const posts = await getPublishedPosts();
  const series = await getAllSeries();

  const seriesSections = (
    await Promise.all(
      series.map(async (s) => {
        const entries = await getPostsBySeries(s.slug);
        return [
          `### ${s.name} (${s.count} post${s.count === 1 ? '' : 's'})`,
          `Index: ${SITE_URL}/series/${s.slug}`,
          ...(s.description ? [s.description] : []),
          ``,
          // Reading order, not publication order — that is the whole point of
          // a series, and it is what an LLM should reproduce when it cites one.
          ...entries.map(
            (post, i) =>
              `${i + 1}. [${post.data.title}](${SITE_URL}/blog/${post.id}/): ${post.data.description}`,
          ),
          ``,
        ].join('\n');
      }),
    )
  ).join('\n');

  const content = [
    `# ${SITE_TITLE}`,
    ``,
    `> ${SITE_TAGLINE}`,
    ``,
    `## About`,
    `${SITE_DESCRIPTION}`,
    `Author: ${AUTHOR}`,
    `Website: ${SITE_URL}`,
    `RSS Feed: ${SITE_URL}/rss.xml`,
    `Full Corpus Feed: ${SITE_URL}/llms-full.txt`,
    ``,
    ...(series.length > 0
      ? [`## Series`, ``, `Multi-post threads, listed in reading order.`, ``, seriesSections]
      : []),
    `## Essays & Articles`,
    ``,
    ...posts.map((post) => {
      const dateStr = post.data.pubDate.toISOString().split('T')[0];
      const seriesNote = post.data.series ? ` · Series: ${post.data.series}` : '';
      return `- [${post.data.title}](${SITE_URL}/blog/${post.id}/): ${post.data.description} (${dateStr} · Category: ${post.data.category}${seriesNote})`;
    }),
    ``,
  ].join('\n');

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
