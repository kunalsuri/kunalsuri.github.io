import type { APIRoute } from 'astro';
import { getPublishedPosts } from '../utils/posts';
import { SITE_TITLE, SITE_DESCRIPTION, SITE_URL, AUTHOR, SITE_TAGLINE } from '../consts';

export const GET: APIRoute = async () => {
  const posts = await getPublishedPosts();

  const header = [
    `# ${SITE_TITLE} — Full Corpus for LLMs`,
    ``,
    `> ${SITE_TAGLINE}`,
    ``,
    `Author: ${AUTHOR}`,
    `Website: ${SITE_URL}`,
    `Description: ${SITE_DESCRIPTION}`,
    ``,
    `---`,
    ``,
  ].join('\n');

  const postContents = posts.map((post) => {
    const dateStr = post.data.pubDate.toISOString().split('T')[0];
    return [
      `# ${post.data.title}`,
      `URL: ${SITE_URL}/blog/${post.id}/`,
      `Published: ${dateStr}`,
      `Category: ${post.data.category}`,
      `Tags: ${post.data.tags.join(', ')}`,
      ...(post.data.series
        ? [
            `Series: ${post.data.series}${
              post.data.seriesOrder ? ` (part ${post.data.seriesOrder})` : ''
            }`,
          ]
        : []),
      `Description: ${post.data.description}`,
      ``,
      post.body ?? '',
      ``,
      `---`,
      ``,
    ].join('\n');
  });

  const content = header + postContents.join('\n');

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
