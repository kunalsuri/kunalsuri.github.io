import fs from 'node:fs/promises';
import path from 'node:path';
import { parseFrontmatter, stringifyFrontmatter, type BlogFrontmatter } from './frontmatter.ts';

// Re-exported (not just used internally) so existing importers of
// sanitizeSlug from this module keep working — the implementation moved to
// slug.ts because it has zero node-builtin dependencies and needs to be
// callable from client-side Preact code too, which this file's fs/path
// imports would break.
export { sanitizeSlug } from './slug.ts';
import { sanitizeSlug } from './slug.ts';

const BLOG_DIR = path.resolve(process.cwd(), 'src/content/blog');

export interface StudioPostSummary {
  slug: string;
  filename: string;
  frontmatter: BlogFrontmatter;
  content: string;
  isFolder?: boolean;
}

// Historically a separate "list item vs. full detail" pair, collapsed into
// one shape: see the comment on getAllStudioPosts() for why the list now
// always carries full content too.
export type StudioPostDetail = StudioPostSummary;

/**
 * Reads all .md and .mdx post files in src/content/blog (both folders and flat files).
 *
 * Returns full `content` for every post, not just frontmatter — this repo's
 * `astro.config.mjs` has no adapter (deploys as pure static files to GitHub
 * Pages), so a per-slug GET (`?slug=...` or a dynamic `[slug]` route) can't
 * reliably work in `astro dev`: Astro treats parameterless/empty-
 * `getStaticPaths` API routes as build-time-prerenderable by default, which
 * in dev strips query strings and (for dynamic path segments) 404s
 * everything, and the one escape hatch — `export const prerender = false`
 * — requires an adapter, which would break the static production build.
 * Bundling content into the one plain `GET /api/studio/posts` (which takes
 * no parameters and is therefore prerender-safe) sidesteps the whole
 * problem: the client already has everything it needs after one fetch, so
 * "load post by slug" becomes a pure client-side array lookup.
 */
export async function getAllStudioPosts(): Promise<StudioPostSummary[]> {
  try {
    await fs.mkdir(BLOG_DIR, { recursive: true });
    const entries = await fs.readdir(BLOG_DIR, { withFileTypes: true });

    const posts: StudioPostSummary[] = [];
    const processedSlugs = new Set<string>();

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const folderSlug = entry.name;
        const folderPath = path.join(BLOG_DIR, folderSlug);
        const subFiles = await fs.readdir(folderPath);

        // Find primary post file in folder: index.md > index.mdx > <folderSlug>.md > <folderSlug>.mdx > first .md/.mdx
        const candidate =
          subFiles.find((f) => f === 'index.md') ||
          subFiles.find((f) => f === 'index.mdx') ||
          subFiles.find((f) => f === `${folderSlug}.md`) ||
          subFiles.find((f) => f === `${folderSlug}.mdx`) ||
          subFiles.find((f) => f.endsWith('.md') || f.endsWith('.mdx'));

        if (candidate) {
          const filePath = path.join(folderPath, candidate);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const parsed = parseFrontmatter(fileContent);

          processedSlugs.add(folderSlug);
          posts.push({
            slug: folderSlug,
            filename: path.join(folderSlug, candidate).replace(/\\/g, '/'),
            frontmatter: parsed.frontmatter,
            content: parsed.content,
            isFolder: true,
          });
        }
      } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
        const slug = entry.name.replace(/\.(md|mdx)$/, '');
        if (!processedSlugs.has(slug)) {
          const filePath = path.join(BLOG_DIR, entry.name);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const parsed = parseFrontmatter(fileContent);

          processedSlugs.add(slug);
          posts.push({
            slug,
            filename: entry.name,
            frontmatter: parsed.frontmatter,
            content: parsed.content,
            isFolder: false,
          });
        }
      }
    }

    // Sort by pubDate descending
    return posts.sort((a, b) => {
      const dateA = new Date(a.frontmatter.pubDate).getTime();
      const dateB = new Date(b.frontmatter.pubDate).getTime();
      return dateB - dateA;
    });
  } catch (err) {
    console.error('[Atelier FS] Error listing posts:', err);
    return [];
  }
}

/**
 * Reads a single post file by slug (checking folder format first, then flat files)
 */
export async function getStudioPostBySlug(slug: string): Promise<StudioPostDetail | null> {
  try {
    const cleanSlug = sanitizeSlug(slug);
    const folderPath = path.join(BLOG_DIR, cleanSlug);

    // 1. Check folder format first
    try {
      const stat = await fs.stat(folderPath);
      if (stat.isDirectory()) {
        const subFiles = await fs.readdir(folderPath);
        const candidate =
          subFiles.find((f) => f === 'index.md') ||
          subFiles.find((f) => f === 'index.mdx') ||
          subFiles.find((f) => f === `${cleanSlug}.md`) ||
          subFiles.find((f) => f === `${cleanSlug}.mdx`) ||
          subFiles.find((f) => f.endsWith('.md') || f.endsWith('.mdx'));

        if (candidate) {
          const filePath = path.join(folderPath, candidate);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const parsed = parseFrontmatter(fileContent);

          return {
            slug: cleanSlug,
            filename: path.join(cleanSlug, candidate).replace(/\\/g, '/'),
            frontmatter: parsed.frontmatter,
            content: parsed.content,
            isFolder: true,
          };
        }
      }
    } catch {
      // Folder does not exist, fall through to flat file check
    }

    // 2. Check flat files
    let filePath = path.join(BLOG_DIR, `${cleanSlug}.md`);
    try {
      await fs.access(filePath);
    } catch {
      filePath = path.join(BLOG_DIR, `${cleanSlug}.mdx`);
      await fs.access(filePath);
    }

    const fileContent = await fs.readFile(filePath, 'utf-8');
    const parsed = parseFrontmatter(fileContent);

    return {
      slug: cleanSlug,
      filename: path.basename(filePath),
      frontmatter: parsed.frontmatter,
      content: parsed.content,
      isFolder: false,
    };
  } catch {
    return null;
  }
}

/**
 * Saves or updates a post in folder format under src/content/blog/<slug>/index.md
 */
export async function saveStudioPost(
  slug: string,
  frontmatter: Partial<BlogFrontmatter>,
  content: string,
  oldSlug?: string
): Promise<{ success: boolean; slug: string; filename: string }> {
  try {
    await fs.mkdir(BLOG_DIR, { recursive: true });

    const cleanSlug = sanitizeSlug(slug || frontmatter.title || 'untitled-post');
    const postDir = path.join(BLOG_DIR, cleanSlug);

    // Handle slug change / old post cleanup
    if (oldSlug) {
      const cleanOldSlug = sanitizeSlug(oldSlug);
      if (cleanOldSlug !== cleanSlug) {
        const oldFolder = path.join(BLOG_DIR, cleanOldSlug);

        // Move the folder — and anything co-located inside it, e.g. images
        // or diagrams — to the new slug in one step. This used to instead
        // fs.rm() the old folder outright and write only a fresh index.md
        // at the new path, which silently discarded every co-located asset
        // on any rename (caught live: renaming a post with 4 co-located
        // images deleted all 4, the new folder ended up with just index.md).
        const oldFolderStat = await fs.stat(oldFolder).catch(() => null);
        if (oldFolderStat?.isDirectory()) {
          await fs.rename(oldFolder, postDir);
        }

        await fs.rm(path.join(BLOG_DIR, `${cleanOldSlug}.md`), { force: true });
        await fs.rm(path.join(BLOG_DIR, `${cleanOldSlug}.mdx`), { force: true });
      }
    }

    await fs.mkdir(postDir, { recursive: true });

    const targetPath = path.join(postDir, 'index.md');
    const relativeFilename = `${cleanSlug}/index.md`;

    // Remove legacy flat file if migrating to folder format
    await fs.rm(path.join(BLOG_DIR, `${cleanSlug}.md`), { force: true });
    await fs.rm(path.join(BLOG_DIR, `${cleanSlug}.mdx`), { force: true });

    const fileData = stringifyFrontmatter(frontmatter, content);
    await fs.writeFile(targetPath, fileData, 'utf-8');

    return {
      success: true,
      slug: cleanSlug,
      filename: relativeFilename,
    };
  } catch (err) {
    console.error('[Atelier FS] Error saving post:', err);
    throw err;
  }
}

/**
 * Deletes a post directory and any legacy flat files by slug
 */
export async function deleteStudioPost(slug: string): Promise<boolean> {
  try {
    const cleanSlug = sanitizeSlug(slug);
    const folderPath = path.join(BLOG_DIR, cleanSlug);
    const pathMd = path.join(BLOG_DIR, `${cleanSlug}.md`);
    const pathMdx = path.join(BLOG_DIR, `${cleanSlug}.mdx`);

    await fs.rm(folderPath, { recursive: true, force: true });
    await fs.rm(pathMd, { force: true });
    await fs.rm(pathMdx, { force: true });

    return true;
  } catch (err) {
    console.error(`[Atelier FS] Error deleting post ${slug}:`, err);
    return false;
  }
}

/**
 * Saves a binary image stream co-located in src/content/blog/<slug>/<filename>
 */
export async function saveStudioImage(
  slug: string,
  filename: string,
  arrayBuffer: ArrayBuffer
): Promise<{ success: boolean; relativeUrl: string; publicUrl: string; previewUrl: string }> {
  try {
    const cleanSlug = sanitizeSlug(slug || 'general');
    const targetDir = path.join(BLOG_DIR, cleanSlug);

    await fs.mkdir(targetDir, { recursive: true });

    const safeFilename = filename.toLowerCase().replace(/[^\w.-]/g, '_');
    const targetPath = path.join(targetDir, safeFilename);

    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(targetPath, buffer);

    const relativeUrl = `./${safeFilename}`;
    const previewUrl = `/api/studio/assets/${cleanSlug}/${safeFilename}`;

    return {
      success: true,
      relativeUrl,
      publicUrl: relativeUrl,
      previewUrl,
    };
  } catch (err) {
    console.error('[Atelier FS] Error saving image:', err);
    throw err;
  }
}

