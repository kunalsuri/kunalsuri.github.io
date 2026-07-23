import { useState } from 'preact/hooks';
import { Popover } from './ui/Popover.tsx';
import { Button } from './ui/Button.tsx';
import { Icon } from './ui/Icon.tsx';
import { Select } from './ui/Select.tsx';
import { SegmentedControl } from './ui/SegmentedControl.tsx';
import { THEME_OPTIONS, type StudioTheme } from './theme.ts';

export type FontFamily = 'serif' | 'sans' | 'mono';

const FONT_FAMILY_OPTIONS: Array<{ value: FontFamily; label: string }> = [
  { value: 'serif', label: 'Serif' },
  { value: 'sans', label: 'Sans' },
  { value: 'mono', label: 'Mono' },
];

const MIN_FONT_SIZE = 14;
const MAX_FONT_SIZE = 26;

interface AppearanceMenuProps {
  theme: StudioTheme;
  onThemeChange: (theme: StudioTheme) => void;
  fontFamily: FontFamily;
  onFontFamilyChange: (font: FontFamily) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  onEnterZenMode: () => void;
}

/**
 * Folds four "how the workspace looks" controls — theme, font family, font
 * size, Zen mode — that previously sat as four permanent header fixtures
 * into one disclosure button. None of these are things a writer looks at
 * while writing; they're set once in a while, so they shouldn't cost four
 * slots of header real estate all the time. A side effect worth noting: on
 * narrow viewports the old controls were hidden entirely (`hidden sm:...`)
 * to save space — this one button has room for all four regardless of
 * viewport width, so nothing is mobile-only-missing anymore.
 */
export function AppearanceMenu({
  theme,
  onThemeChange,
  fontFamily,
  onFontFamilyChange,
  fontSize,
  onFontSizeChange,
  onEnterZenMode,
}: AppearanceMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onClose={() => setIsOpen(false)} anchor={
      <Button
        variant="secondary"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Appearance: theme, font, size, Zen mode"
      >
        Aa
        <Icon name="chevron-down" size={12} />
      </Button>
    }>
      <div className="w-64 p-4 space-y-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--studio-text-muted)] mb-1.5">
            Theme
          </label>
          <Select value={theme} onChange={onThemeChange} options={THEME_OPTIONS.map((t) => ({ value: t.value, label: t.label }))} />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--studio-text-muted)] mb-1.5">
            Font
          </label>
          <SegmentedControl value={fontFamily} onChange={onFontFamilyChange} options={FONT_FAMILY_OPTIONS} fullWidth />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--studio-text-muted)] mb-1.5">
            Size
          </label>
          <div className="flex items-center justify-between gap-2 bg-[var(--studio-bg)] border border-[var(--studio-border)] rounded-xl px-2 py-1.5">
            <button
              type="button"
              onClick={() => onFontSizeChange(Math.max(MIN_FONT_SIZE, fontSize - 2))}
              className="px-2 font-bold text-[var(--studio-text-secondary)] hover:text-[var(--studio-text-primary)] transition-colors"
              title="Decrease font size"
            >
              A-
            </button>
            <span className="text-xs font-mono text-[var(--studio-accent)]">{fontSize}px</span>
            <button
              type="button"
              onClick={() => onFontSizeChange(Math.min(MAX_FONT_SIZE, fontSize + 2))}
              className="px-2 font-bold text-[var(--studio-text-secondary)] hover:text-[var(--studio-text-primary)] transition-colors"
              title="Increase font size"
            >
              A+
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-[var(--studio-border)]">
          <Button
            variant="secondary"
            icon="expand"
            onClick={() => {
              setIsOpen(false);
              onEnterZenMode();
            }}
            className="w-full"
          >
            Enter Zen Mode
          </Button>
        </div>
      </div>
    </Popover>
  );
}
