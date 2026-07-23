export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  size?: 'sm' | 'md';
  /** Stretch options to share the container's full width equally (e.g.
   * PostSidebar's filter bar), instead of the default shrink-to-content. */
  fullWidth?: boolean;
  className?: string;
}

/** A "pill group" of mutually-exclusive options — used for the font-family
 * switcher, editor view mode, post filter, and stock-photo provider, which
 * were previously four independent hand-rolled copies of the same active/
 * inactive ternary classes. Modeled as an ARIA radiogroup since exactly one
 * option is always selected. */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
  fullWidth = false,
  className = '',
}: SegmentedControlProps<T>) {
  const sizeClass = size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-3 py-1 text-xs';

  return (
    <div
      role="radiogroup"
      className={`${fullWidth ? 'flex w-full' : 'inline-flex'} items-center gap-1 bg-[var(--studio-bg)] border border-[var(--studio-border)] p-1 rounded-xl ${className}`}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`${fullWidth ? 'flex-1' : ''} ${sizeClass} rounded-lg font-semibold transition-colors ${
              active
                ? 'bg-[var(--studio-bg-card)] text-[var(--studio-accent)] shadow-sm'
                : 'text-[var(--studio-text-muted)] hover:text-[var(--studio-text-primary)]'
            }`}
          >
            {opt.label}
            {typeof opt.count === 'number' && <span className="ml-1 opacity-70">({opt.count})</span>}
          </button>
        );
      })}
    </div>
  );
}
