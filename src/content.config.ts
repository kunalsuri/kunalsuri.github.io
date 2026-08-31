import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { z } from 'zod';

// Astro's Content Layer API (Astro 5+): the `glob` loader turns Markdown/MDX
// files in src/content/blog into a typed collection, validated at build time
// against the schema below. Bad front-matter = a build error, not a silent bug.
const blog = defineCollection({
  loader: glob({
    base: './src/content/blog',
    pattern: '**/*.{md,mdx}',
    generateId: ({ entry }) => {
      const withoutExt = entry.replace(/\.(md|mdx)$/, '');
      const parts = withoutExt.split('/');
      const filename = parts[parts.length - 1];
      const parentDir = parts[parts.length - 2];

      if (filename === 'index' && parentDir) {
        return parentDir;
      }
      return filename;
    },
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    // One category (a section), many tags (fine-grained topics).
    category: z.string().default('Notes'),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    // A series is an ordered, open-ended run of posts that share a spine
    // (e.g. "What Is"). It is orthogonal to `category`: a post can be
    // Engineering *and* part of the What Is series. Omit for standalone posts.
    series: z.string().optional(),
    // Explicit position within the series. Optional — posts without one fall
    // back to pubDate order, so you only set it when reading order differs
    // from publication order.
    seriesOrder: z.number().int().positive().optional(),
  }),
});

export const collections = { blog };
