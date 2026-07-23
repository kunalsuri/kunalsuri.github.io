import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const DIST_DIR = path.resolve('dist');

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
    const astroBin = path.resolve('node_modules', 'astro', 'bin', 'astro.mjs');
    execSync(`"${process.execPath}" "${astroBin}" build`, {
      cwd: path.resolve('.'),
      stdio: 'pipe',
      timeout: 120_000,
    });
  }
}, 120_000);

describe('AI Discoverability & LLM Support', () => {
  describe('robots.txt', () => {
    it('exists in dist/robots.txt', () => {
      const robotsPath = path.join(DIST_DIR, 'robots.txt');
      expect(fs.existsSync(robotsPath)).toBe(true);
    });

    it('contains permissions for AI search crawlers (Perplexity, GPTBot, ClaudeBot)', () => {
      const content = fs.readFileSync(path.join(DIST_DIR, 'robots.txt'), 'utf-8');
      expect(content).toContain('User-agent: PerplexityBot');
      expect(content).toContain('User-agent: GPTBot');
      expect(content).toContain('User-agent: ClaudeBot');
      expect(content).toContain('LLMs-Directory:');
    });
  });

  describe('llms.txt endpoint', () => {
    it('exists in dist/llms.txt', () => {
      const llmsPath = path.join(DIST_DIR, 'llms.txt');
      expect(fs.existsSync(llmsPath)).toBe(true);
    });

    it('contains site title, tagline, and markdown links to essays', () => {
      const content = fs.readFileSync(path.join(DIST_DIR, 'llms.txt'), 'utf-8');
      expect(content).toContain('# Kunal Suri');
      expect(content).toContain('## Essays & Articles');
      expect(content).toMatch(/- \[[^\]]+\]\(https:\/\/kunalsuri\.github\.io\/blog\/[^\)]+\):/);
    });
  });

  describe('llms-full.txt endpoint', () => {
    it('exists in dist/llms-full.txt', () => {
      const llmsFullPath = path.join(DIST_DIR, 'llms-full.txt');
      expect(fs.existsSync(llmsFullPath)).toBe(true);
    });

    it('contains full plain-text markdown content of published posts', () => {
      const content = fs.readFileSync(path.join(DIST_DIR, 'llms-full.txt'), 'utf-8');
      expect(content).toContain('# Kunal Suri — Full Corpus for LLMs');
      expect(content).toContain('URL: https://kunalsuri.github.io/blog/');
    });
  });

  describe('JSON-LD Structured Data Schema', () => {
    it('blog post pages contain valid BlogPosting JSON-LD schema', () => {
      const blogDir = path.join(DIST_DIR, 'blog');
      const entries = fs.readdirSync(blogDir, { withFileTypes: true });
      const postDir = entries.find((e) => e.isDirectory());
      if (postDir) {
        const html = fs.readFileSync(path.join(blogDir, postDir.name, 'index.html'), 'utf-8');
        expect(html).toContain('application/ld+json');
        expect(html).toContain('"@type":"BlogPosting"');
        expect(html).toContain('"headline"');
        expect(html).toContain('"author"');
      }
    });

    it('homepage contains WebSite JSON-LD schema', () => {
      const html = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf-8');
      expect(html).toContain('application/ld+json');
      expect(html).toContain('"@type":"WebSite"');
    });
  });
});
