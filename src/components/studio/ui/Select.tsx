import { useId } from 'preact/hooks';
import type { TargetedEvent } from 'preact';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> {
  label?: string;
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  id?: string;
  className?: string;
  containerClassName?: string;
  disabled?: boolean;
}

/** Thin wrapper over a native <select> — a custom listbox would be
 * over-engineering for Studio's two closed-list use cases (theme, category).
 * Generic over the option value type so callers get real union types back,
 * not a bare `string`. */
export function Select<T extends string>({
  label,
  value,
  onChange,
  options,
  id,
  className = '',
  containerClassName = '',
  disabled,
}: SelectProps<T>) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  const handleChange = (e: TargetedEvent<HTMLSelectElement>) => {
    // The one unavoidable cast in this file: a native <select> change event
    // always hands back a bare string. Narrowing to T happens here, once,
    // at the DOM boundary — every call site stays fully typed.
    onChange(e.currentTarget.value as T);
  };

  return (
    <div className={containerClassName}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-[10px] font-bold uppercase tracking-wider text-[var(--studio-text-muted)] mb-1.5"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        disabled={disabled}
        onChange={handleChange}
        className={`w-full bg-[var(--studio-bg)] border border-[var(--studio-border)] rounded-xl px-2.5 py-2 text-xs text-[var(--studio-text-primary)] focus:outline-none focus:border-[var(--studio-accent)] transition-colors ${className}`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
