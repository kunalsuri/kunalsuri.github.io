import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const DIST_DIR = path.resolve('dist');

/**
 * Build-output integration tests.
 *
 * These tests run `astro build` once and then validate the generated HTML files.
 * The suite is self-contained: if `dist/` already exists with a recent build,
 * it reuses it; otherwise it triggers a fresh build.
 *
 * NOTE: This suite is slower (~10-20 s for the build step). Run it with:
 *   npm run test:integration
 *   npm test                   (also includes unit tests)
 */

/** Check if dist/ exists, has index.html, and is newer than any file in src/. */
function isDistFresh(): boolean {
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) return false;
  const distMtime = fs.statSync(indexPath).mtimeMs;
  const srcDir = path.resolve('src');

  const checkFreshness = (dir: string): boolean => {
    if (!fs.existsSync(dir)) return true;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!checkFreshness(fullPath)) return false;
      } else if (fs.statSync(fullPath).mtimeMs > distMtime) {
        return false;
      }
    }
    return true;
  };

  return checkFreshness(srcDir);
}

beforeAll(() => {
  if (!isDistFresh()) {
    // Build the site. Use Astro directly (not `npm run build`) so we skip
    // pagefind post-build — we only care about the Astro-generated HTML.
    const astroBin = path.resolve('node_modules', 'astro', 'bin', 'astro.mjs');
    execSync(`"${process.execPath}" "${astroBin}" build`, {
      cwd: path.resolve('.'),
      stdio: 'pipe',
      timeout: 120_000, // 2-minute timeout
    });
  }
}, 120_000); // Vitest timeout for this hook

/** Read a file from dist/ relative to the dist root. */
function readDist(relativePath: string): string {
  return fs.readFileSync(path.join(DIST_DIR, relativePath), 'utf-8');
}

/** Check if a file exists in dist/. */
function distHas(relativePath: string): boolean {
  return fs.existsSync(path.join(DIST_DIR, relativePath));
}

/** Recursively find all HTML files in dist/. */
function findHtmlFiles(dir: string = DIST_DIR): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findHtmlFiles(full));
    } else if (entry.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

describe('Build output', () => {
  it('dist/ directory exists', () => {
    expect(fs.existsSync(DIST_DIR)).toBe(true);
  });

  describe('expected pages exist', () => {
    const expectedPages = [
      'index.html',
      'about/index.html',
      'blog/index.html',
      'archive/index.html',
      'search/index.html',
      'tags/index.html',
      'categories/index.html',
    ];

    it.each(expectedPages)('%s exists', (page) => {
      expect(distHas(page)).toBe(true);
    });
  });

  describe('blog posts have generated pages', () => {
    it('at least one blog post page exists in dist/blog/', () => {
      const blogDir = path.join(DIST_DIR, 'blog');
      if (!fs.existsSync(blogDir)) {
        expect.fail('dist/blog/ directory does not exist');
      }
      const entries = fs.readdirSync(blogDir, { withFileTypes: true });
      const postDirs = entries.filter(
        (e) => e.isDirectory() && e.name !== 'index.html',
      );
      expect(postDirs.length).toBeGreaterThan(0);
    });
  });

  describe('RSS feed', () => {
    it('rss.xml exists', () => {
      expect(distHas('rss.xml')).toBe(true);
    });

    it('is valid XML with a <channel> element', () => {
      const rss = readDist('rss.xml');
      expect(rss).toContain('<channel>');
      expect(rss).toContain('</channel>');
    });

    it('contains at least one <item>', () => {
      const rss = readDist('rss.xml');
      expect(rss).toContain('<item>');
    });
  });

  describe('sitemap', () => {
    it('sitemap-index.xml exists', () => {
      expect(distHas('sitemap-index.xml')).toBe(true);
    });
  });

  describe('HTML quality checks', () => {
    // Only test a representative set to keep tests fast
    const pagesToCheck = [
      'index.html',
      'about/index.html',
      'blog/index.html',
      'archive/index.html',
    ];

    describe.each(pagesToCheck)('page: %s', (page) => {
      it('has a <title> tag', () => {
        const html = readDist(page);
        expect(html).toMatch(/<title>[\s\S]*?<\/title>/);
      });

      it('has a meta description', () => {
        const html = readDist(page);
        expect(html).toMatch(/<meta\s+name="description"\s+content="[^"]+"/);
      });

      it('has a canonical URL', () => {
        const html = readDist(page);
        expect(html).toMatch(/<link\s+rel="canonical"\s+href="[^"]+"/);
      });

      it('has an og:title meta tag', () => {
        const html = readDist(page);
        expect(html).toMatch(/<meta\s+property="og:title"\s+content="[^"]+"/);
      });

      it('has an og:description meta tag', () => {
        const html = readDist(page);
        expect(html).toMatch(/<meta\s+property="og:description"\s+content="[^"]+"/);
      });

      it('has a viewport meta tag', () => {
        const html = readDist(page);
        expect(html).toContain('name="viewport"');
      });

      it('has a charset declaration', () => {
        const html = readDist(page);
        expect(html).toMatch(/charset=["']?utf-8["']?/i);
      });

      it('contains lang="en" on the html element', () => {
        const html = readDist(page);
        expect(html).toMatch(/<html\s[^>]*lang="en"/);
      });
    });

    it('every HTML file has a <title> tag', () => {
      const htmlFiles = findHtmlFiles();
      for (const file of htmlFiles) {
        const html = fs.readFileSync(file, 'utf-8');
        const relPath = path.relative(DIST_DIR, file);
        expect(html, `Missing <title> in ${relPath}`).toMatch(
          /<title>[\s\S]*?<\/title>/,
        );
      }
    });
  });

  describe('internal link integrity', () => {
    it('no obviously broken internal links in key pages', () => {
      const pagesToScan = [
        'index.html',
        'blog/index.html',
        'about/index.html',
      ];

      for (const page of pagesToScan) {
        const html = readDist(page);
        // Extract all href values that look like internal links (start with /)
        const linkMatches = html.matchAll(/href="(\/[^"]*?)"/g);
        for (const match of linkMatches) {
          const href = match[1];
          // Normalize: /blog/ → blog/index.html, /rss.xml → rss.xml
          let filePath: string;
          if (href.endsWith('/')) {
            filePath = href.slice(1) + 'index.html';
          } else if (href.includes('.')) {
            filePath = href.slice(1);
          } else {
            filePath = href.slice(1) + '/index.html';
          }

          // Skip pagefind (generated separately), favicon, and fragment-only links
          if (
            filePath.startsWith('pagefind/') ||
            filePath.startsWith('favicon') ||
            filePath === '' // empty href after stripping /
          ) {
            continue;
          }

          expect(
            distHas(filePath),
            `Broken link "${href}" in ${page} → expected dist/${filePath}`,
          ).toBe(true);
        }
      }
    });
  });
});
