import { describe, it, expect } from 'vitest';
import { renderPreviewHtml } from '../../src/utils/markdown-preview.ts';

const ASSET_BASE = '/api/studio/assets/my-post';

describe('Studio markdown live preview', () => {
  it('returns an empty string for empty/whitespace input', () => {
    expect(renderPreviewHtml('', ASSET_BASE)).toBe('');
    expect(renderPreviewHtml('   \n  ', ASSET_BASE)).toBe('');
  });

  it('renders inline formatting — the exact bug being fixed', () => {
    // The old hand-rolled line-by-line renderer never handled inline
    // markup at all; **bold**/*italic* showed up as literal asterisks.
    const html = renderPreviewHtml('This is **bold** and *italic* and `code`.', ASSET_BASE);
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toContain('<code>code</code>');
  });

  it('renders headings and blockquotes', () => {
    const html = renderPreviewHtml('# Title\n\n## Subtitle\n\n> A quote', ASSET_BASE);
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<h2>Subtitle</h2>');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('A quote');
  });

  it('renders links with resolved hrefs', () => {
    const html = renderPreviewHtml('[Astro](https://astro.build)', ASSET_BASE);
    expect(html).toContain('<a href="https://astro.build">Astro</a>');
  });

  it('supports GFM: tables and strikethrough', () => {
    const html = renderPreviewHtml('| A | B |\n| - | - |\n| 1 | 2 |\n\n~~gone~~', ASSET_BASE);
    expect(html).toContain('<table>');
    expect(html).toContain('<del>gone</del>');
  });

  it('rewrites relative image paths to the Studio asset API', () => {
    const html = renderPreviewHtml('![Cover](./cover.jpg)', ASSET_BASE);
    expect(html).toContain(`src="${ASSET_BASE}/cover.jpg"`);

    const bareFilename = renderPreviewHtml('![Cover](cover.jpg)', ASSET_BASE);
    expect(bareFilename).toContain(`src="${ASSET_BASE}/cover.jpg"`);
  });

  it('leaves absolute/remote/data image URLs untouched', () => {
    const remote = renderPreviewHtml('![X](https://example.com/x.jpg)', ASSET_BASE);
    expect(remote).toContain('src="https://example.com/x.jpg"');

    const absolute = renderPreviewHtml('![X](/public/x.jpg)', ASSET_BASE);
    expect(absolute).toContain('src="/public/x.jpg"');
  });

  it('passes through raw inline HTML instead of escaping it', () => {
    // allowDangerousHtml: real content in this repo contains a literal
    // <br> that should render as a line break in the preview, not text.
    const html = renderPreviewHtml('Line one<br>Line two', ASSET_BASE);
    expect(html).toContain('<br>');
    expect(html).not.toContain('&lt;br&gt;');
  });

  it('renders bookmark card syntax with valid class attributes', () => {
    const cardMarkdown = '[bookmark:Astro Framework](https://astro.build "astro.build|The web framework for content-driven websites|https://astro.build/og.png")';
    const html = renderPreviewHtml(cardMarkdown, ASSET_BASE);
    expect(html).toContain('class="studio-bookmark-card');
    expect(html).toContain('class="flex-1 min-w-0"');
    expect(html).not.toContain('className="');
    expect(html).toContain('href="https://astro.build"');
    expect(html).toContain('Astro Framework');
    expect(html).toContain('astro.build');
  });
});
