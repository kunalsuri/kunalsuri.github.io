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

describe('Reader Experience & Techno-Media Features', () => {
  const helloWorldHtmlPath = path.join(DIST_DIR, 'blog', 'hello-world', 'index.html');

  it('renders reading progress bar container', () => {
    expect(fs.existsSync(helloWorldHtmlPath)).toBe(true);
    const html = fs.readFileSync(helloWorldHtmlPath, 'utf-8');
    expect(html).toContain('id="reading-progress"');
  });

  it('renders selection toolbar for Medium-style quote sharing', () => {
    const html = fs.readFileSync(helloWorldHtmlPath, 'utf-8');
    expect(html).toContain('id="selection-toolbar"');
    expect(html).toContain('id="btn-quote-copy"');
    expect(html).toContain('id="btn-share-x"');
  });

  it('renders text-to-speech AudioPlayer widget', () => {
    const html = fs.readFileSync(helloWorldHtmlPath, 'utf-8');
    expect(html).toContain('id="audio-player"');
    expect(html).toContain('id="tts-play-btn"');
    expect(html).toContain('id="tts-speed-btn"');
    expect(html).toContain('id="tts-status"');
  });

  it('renders image lightbox overlay elements', () => {
    const html = fs.readFileSync(helloWorldHtmlPath, 'utf-8');
    expect(html).toContain('id="lightbox-overlay"');
    expect(html).toContain('id="lightbox-img"');
  });

  it('renders Copy for AI Prompt exporter button', () => {
    const html = fs.readFileSync(helloWorldHtmlPath, 'utf-8');
    expect(html).toContain('id="copy-ai-btn"');
    expect(html).toContain('Copy for AI');
  });

  it('renders ClapButton applause widget with local counter', () => {
    const html = fs.readFileSync(helloWorldHtmlPath, 'utf-8');
    expect(html).toContain('id="clap-btn"');
    expect(html).toContain('id="clap-count"');
    expect(html).toContain('claps');
  });

  it('renders desktop sidebar TOC and mobile TOC for articles with headings', () => {
    const html = fs.readFileSync(helloWorldHtmlPath, 'utf-8');
    expect(html).toContain('On this page');
    expect(html).toContain('Table of Contents');
    expect(html).toContain('toc-link');
  });
});
