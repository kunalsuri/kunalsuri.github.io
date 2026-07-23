import type { IconName } from './ui/Icon.tsx';

export type StudioTheme = 'dark' | 'light' | 'midnight' | 'paper';

export const DEFAULT_THEME: StudioTheme = 'dark';

export function isStudioTheme(value: unknown): value is StudioTheme {
  return value === 'dark' || value === 'light' || value === 'midnight' || value === 'paper';
}

/** Single source of truth for theme metadata — consumed by both the header's
 * theme Select and CommandPaletteModal's theme-switch actions, which
 * previously duplicated these labels independently. */
export const THEME_OPTIONS: Array<{ value: StudioTheme; label: string; icon: IconName }> = [
  { value: 'dark', label: 'Dark Onyx', icon: 'moon' },
  { value: 'light', label: 'Light Studio', icon: 'sun' },
  { value: 'midnight', label: 'Midnight', icon: 'moon-stars' },
  { value: 'paper', label: 'Warm Paper', icon: 'scroll' },
];
