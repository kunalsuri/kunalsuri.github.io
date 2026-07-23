import type { APIRoute } from 'astro';
import { getPublishedPosts } from '../utils/posts';
import { SITE_TITLE, SITE_DESCRIPTION, SITE_URL, AUTHOR, SITE_TAGLINE } from '../consts';

export const GET: APIRoute = async () => {
  const posts = await getPublishedPosts();

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
    `## Essays & Articles`,
    ``,
    ...posts.map((post) => {
      const dateStr = post.data.pubDate.toISOString().split('T')[0];
      return `- [${post.data.title}](${SITE_URL}/blog/${post.id}/): ${post.data.description} (${dateStr} · Category: ${post.data.category})`;
    }),
    ``,
  ].join('\n');

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
