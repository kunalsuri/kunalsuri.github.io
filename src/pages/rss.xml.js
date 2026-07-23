import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

// This file becomes the /rss.xml endpoint. It always excludes drafts, since a
// feed is public by definition (no dev-only preview here).
export async function GET(context) {
  const posts = await getCollection('blog', ({ data }) => data.draft !== true);

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: posts
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .map((post) => ({
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        link: `/blog/${post.id}/`,
      })),
  });
}
