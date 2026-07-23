/**
 * Pure string slugification — no node builtins, unlike studio-fs.ts (which
 * needs fs/path and can't be imported from client-side Preact code). Lives
 * here so both the server-side FS layer and the client-side editor UI can
 * share one implementation instead of the UI silently drifting out of sync
 * with what actually gets saved to disk.
 */
export function sanitizeSlug(titleOrSlug: string): string {
  return titleOrSlug
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
