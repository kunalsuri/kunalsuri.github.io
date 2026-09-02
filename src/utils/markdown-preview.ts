import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

/** Minimal structural slice of a unist/mdast node — just enough to walk the
 * tree and rewrite image URLs, without depending on mdast's full (and
 * unified's quite strict generic) node type machinery for one small step. */
interface AstNode {
  type: string;
  url?: string;
  children?: AstNode[];
}

const ABSOLUTE_URL = /^([a-z][a-z0-9+.-]*:)?\/\//i;

function resolveAssetUrl(url: string, assetBaseUrl: string): string {
  if (!url || ABSOLUTE_URL.test(url) || url.startsWith('/') || url.startsWith('data:')) {
    return url;
  }
  return `${assetBaseUrl}/${url.replace(/^\.\//, '')}`;
}

function rewriteImageUrls(node: AstNode, assetBaseUrl: string): void {
  if (node.type === 'image' && typeof node.url === 'string') {
    node.url = resolveAssetUrl(node.url, assetBaseUrl);
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      rewriteImageUrls(child, assetBaseUrl);
    }
  }
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeStringify, { allowDangerousHtml: true });

/**
 * Renders markdown to HTML for Studio's live split-preview.
 *
 * Runs client-side with no output sanitizer — an accepted trust boundary,
 * since Studio is dev-only, localhost-gated, and single-author (the only
 * person who could inject a payload is the one holding the keyboard).
 * `allowDangerousHtml` is on for the same reason, and because real posts in
 * this repo contain literal inline HTML (e.g. `<br>`) that should render,
 * not show up as escaped text.
 *
 * Relative image paths (`./cover.jpg`, `cover.jpg`) are rewritten to
 * Studio's asset-serving API so co-located images preview correctly before
 * the post is ever built by Astro.
 */
export function renderPreviewHtml(markdown: string, assetBaseUrl: string): string {
  if (!markdown.trim()) return '';

  // Pre-process bookmark cards syntax: [bookmark:Title](url "domain|description|image")
  const processedMarkdown = markdown.replace(
    /\[bookmark:([^\]]+)\]\((https?:\/\/[^\s\)]+)(?:\s+"([^"]*)")?\)/g,
    (_, title, url, metaStr = '') => {
      const parts = metaStr.split('|');
      const domain = parts[0] || new URL(url).hostname;
      const desc = parts[1] || '';
      const img = parts[2] || '';

      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="studio-bookmark-card my-4 flex items-center justify-between gap-4 rounded-xl border border-[var(--studio-border)] bg-[var(--studio-bg-card)] p-4 no-underline transition-all hover:border-[var(--studio-accent)] hover:shadow-md">
        <div class="flex-1 min-w-0">
          <div class="text-xs font-semibold text-[var(--studio-accent)] uppercase tracking-wider mb-1">${domain}</div>
          <div class="text-sm font-bold text-[var(--studio-text-primary)] truncate">${title}</div>
          ${desc ? `<div class="text-xs text-[var(--studio-text-muted)] line-clamp-2 mt-1">${desc}</div>` : ''}
        </div>
        ${img ? `<img src="${img}" alt="" class="h-16 w-24 object-cover rounded-lg border border-[var(--studio-border)] flex-shrink-0" />` : ''}
      </a>`;
    }
  );

  const tree = processor.parse(processedMarkdown);
  rewriteImageUrls(tree as unknown as AstNode, assetBaseUrl);

  const hast = processor.runSync(tree);
  return String(processor.stringify(hast));
}
