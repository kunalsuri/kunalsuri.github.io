import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const BLOG_DIR = path.resolve('src/content/blog');

/** Read all .md and .mdx files recursively from the blog content directory. */
function getBlogFiles(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  
  const getFilesRecursively = (dir: string): string[] => {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getFilesRecursively(filePath));
      } else if (/\.(md|mdx)$/.test(file)) {
        results.push(path.relative(BLOG_DIR, filePath));
      }
    });
    return results;
  };

  return getFilesRecursively(BLOG_DIR);
}

/**
 * Extract YAML front-matter from a Markdown file.
 * Returns null if the file doesn't start with `---`.
 */
function extractFrontMatter(content: string): Record<string, unknown> | null {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const yaml = match[1];
  const result: Record<string, unknown> = {};

  for (const line of yaml.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    const rawValue = trimmed.slice(colonIndex + 1).trim();

    // Parse simple YAML values
    if (rawValue.startsWith('[')) {
      // Inline array: ["a", "b"]
      try {
        result[key] = JSON.parse(rawValue.replace(/'/g, '"'));
      } catch {
        result[key] = rawValue;
      }
    } else if (rawValue === 'true') {
      result[key] = true;
    } else if (rawValue === 'false') {
      result[key] = false;
    } else if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
      result[key] = rawValue.slice(1, -1);
    } else {
      result[key] = rawValue;
    }
  }

  return result;
}

describe('Blog post files', () => {
  const blogFiles = getBlogFiles();

  it('has at least one blog post', () => {
    expect(blogFiles.length).toBeGreaterThan(0);
  });

  describe.each(blogFiles)('file: %s', (filename) => {
    const filePath = path.join(BLOG_DIR, filename);
    const content = fs.readFileSync(filePath, 'utf-8');
    const frontMatter = extractFrontMatter(content);

    it('has valid YAML front-matter delimiters (---)', () => {
      expect(content).toMatch(/^---\r?\n/);
      expect(frontMatter).not.toBeNull();
    });

    it('has a non-empty title', () => {
      expect(frontMatter?.title).toBeTruthy();
      expect(typeof frontMatter?.title).toBe('string');
    });

    it('has a non-empty description', () => {
      expect(frontMatter?.description).toBeTruthy();
      expect(typeof frontMatter?.description).toBe('string');
    });

    it('has a valid pubDate', () => {
      expect(frontMatter?.pubDate).toBeTruthy();
      const date = new Date(frontMatter!.pubDate as string);
      expect(date.toString()).not.toBe('Invalid Date');
    });

    it('has a pubDate not in the far future (> 1 year from now)', () => {
      const date = new Date(frontMatter!.pubDate as string);
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      expect(date.getTime()).toBeLessThanOrEqual(oneYearFromNow.getTime());
    });

    it('has tags that are all non-empty strings (if present)', () => {
      if (frontMatter?.tags && Array.isArray(frontMatter.tags)) {
        for (const tag of frontMatter.tags) {
          expect(typeof tag).toBe('string');
          expect((tag as string).trim().length).toBeGreaterThan(0);
        }
      }
    });

    it('has a non-empty category (if present)', () => {
      if (frontMatter?.category !== undefined) {
        expect(typeof frontMatter.category).toBe('string');
        expect((frontMatter.category as string).trim().length).toBeGreaterThan(0);
      }
    });

    it('has body content beyond the front-matter', () => {
      const body = content.replace(/^---[\s\S]*?---\r?\n?/, '').trim();
      expect(body.length).toBeGreaterThan(0);
    });

    it('has a URL-safe slug (lowercase, hyphens, no spaces)', () => {
      const withoutExt = filename.replace(/\.(md|mdx)$/, '').replace(/\\/g, '/');
      const parts = withoutExt.split('/');
      const fileBase = parts[parts.length - 1];
      const parentDir = parts[parts.length - 2];
      const slug = (fileBase === 'index' && parentDir) ? parentDir : fileBase;
      expect(slug).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
    });
  });

  it('has no duplicate slugs', () => {
    const slugs = blogFiles.map((f) => {
      const withoutExt = f.replace(/\.(md|mdx)$/, '').replace(/\\/g, '/');
      const parts = withoutExt.split('/');
      const fileBase = parts[parts.length - 1];
      const parentDir = parts[parts.length - 2];
      return (fileBase === 'index' && parentDir) ? parentDir : fileBase;
    });
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
