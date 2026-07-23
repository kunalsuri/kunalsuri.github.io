/**
 * Rough reading-time estimate from raw Markdown body text.
 * 220 wpm is a common prose reading speed; always at least "1 min read".
 */
export function readingTime(markdown: string): string {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 220));
  return `${minutes} min read`;
}
