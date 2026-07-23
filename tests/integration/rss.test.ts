import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { SITE_TITLE } from '../../src/consts';
import { ensureDistBuilt } from './ensure-build';

const DIST_DIR = path.resolve('dist');
const RSS_PATH = path.join(DIST_DIR, 'rss.xml');

beforeAll(() => {
  ensureDistBuilt();
}, 120_000);


function getRssContent(): string {
  return fs.readFileSync(RSS_PATH, 'utf-8');
}

/** Extract all <item> blocks from the RSS XML. */
function extractItems(rss: string): string[] {
  const items: string[] = [];
  const regex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = regex.exec(rss)) !== null) {
    items.push(match[1]);
  }
  return items;
}

/** Extract the text content of an XML tag from a string. */
function extractTag(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}>(.*?)</${tagName}>`, 's');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

describe('RSS feed', () => {
  it('rss.xml exists in dist/', () => {
    expect(fs.existsSync(RSS_PATH)).toBe(true);
  });

  describe('feed structure', () => {
    it('is well-formed XML (has xml declaration or rss root)', () => {
      const rss = getRssContent();
      expect(rss).toMatch(/<\?xml|<rss/);
    });

    it('has an <rss> root element', () => {
      const rss = getRssContent();
      expect(rss).toContain('<rss');
      expect(rss).toContain('</rss>');
    });

    it('has a <channel> element', () => {
      const rss = getRssContent();
      expect(rss).toContain('<channel>');
      expect(rss).toContain('</channel>');
    });

    it('channel contains <title> matching SITE_TITLE', () => {
      const rss = getRssContent();
      const channelMatch = rss.match(/<channel>([\s\S]*?)<\/channel>/);
      expect(channelMatch).not.toBeNull();
      const title = extractTag(channelMatch![1], 'title');
      expect(title).toBe(SITE_TITLE);
    });

    it('channel contains a <description>', () => {
      const rss = getRssContent();
      const channelMatch = rss.match(/<channel>([\s\S]*?)<\/channel>/);
      expect(channelMatch).not.toBeNull();
      const desc = extractTag(channelMatch![1], 'description');
      expect(desc).toBeTruthy();
    });

    it('channel contains a <link>', () => {
      const rss = getRssContent();
      expect(rss).toContain('<link>');
    });
  });

  describe('feed items', () => {
    it('contains at least one <item>', () => {
      const items = extractItems(getRssContent());
      expect(items.length).toBeGreaterThan(0);
    });

    it('every item has a <title>', () => {
      const items = extractItems(getRssContent());
      for (const item of items) {
        const title = extractTag(item, 'title');
        expect(title, 'RSS item missing <title>').toBeTruthy();
      }
    });

    it('every item has a <description>', () => {
      const items = extractItems(getRssContent());
      for (const item of items) {
        const desc = extractTag(item, 'description');
        expect(desc, 'RSS item missing <description>').toBeTruthy();
      }
    });

    it('every item has a <pubDate>', () => {
      const items = extractItems(getRssContent());
      for (const item of items) {
        const pubDate = extractTag(item, 'pubDate');
        expect(pubDate, 'RSS item missing <pubDate>').toBeTruthy();
      }
    });

    it('every item has a <link>', () => {
      const items = extractItems(getRssContent());
      for (const item of items) {
        const link = extractTag(item, 'link');
        expect(link, 'RSS item missing <link>').toBeTruthy();
      }
    });

    it('item links point to /blog/ paths', () => {
      const items = extractItems(getRssContent());
      for (const item of items) {
        const link = extractTag(item, 'link');
        expect(link).toMatch(/\/blog\//);
      }
    });

    it('items are sorted newest-first by pubDate', () => {
      const items = extractItems(getRssContent());
      const dates = items.map((item) => {
        const pubDate = extractTag(item, 'pubDate');
        return new Date(pubDate!).getTime();
      });
      for (let i = 1; i < dates.length; i++) {
        expect(
          dates[i - 1],
          `Item ${i} has an older date than item ${i + 1}`,
        ).toBeGreaterThanOrEqual(dates[i]);
      }
    });

    it('does not contain draft posts', () => {
      // We can't directly check draft status from RSS, but we can verify
      // that no item title contains telltale draft markers — and more
      // importantly, the rss.xml.js endpoint explicitly filters draft: true.
      // This test mainly asserts the feed is coherent.
      const items = extractItems(getRssContent());
      expect(items.length).toBeGreaterThan(0);
      // If there are blog posts, the RSS should have items matching the
      // non-draft post count. We verify by reading the blog directory.
      const blogDir = path.resolve('src/content/blog');
      if (fs.existsSync(blogDir)) {
        const getFilesRecursively = (dir: string): string[] => {
          let results: string[] = [];
          const list = fs.readdirSync(dir);
          list.forEach((file) => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat && stat.isDirectory()) {
              results = results.concat(getFilesRecursively(filePath));
            } else if (/\.(md|mdx)$/.test(file)) {
              results.push(filePath);
            }
          });
          return results;
        };

        const blogFiles = getFilesRecursively(blogDir);
        const nonDraftCount = blogFiles.filter((filePath) => {
          const content = fs.readFileSync(filePath, 'utf-8');
          return !content.match(/^draft:\s*true/m);
        }).length;
        expect(items.length).toBe(nonDraftCount);
      }
    });
  });
});
