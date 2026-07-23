import { useId } from 'preact/hooks';
import type { InputHTMLAttributes } from 'preact';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'label' | 'size'> {
  label?: string;
  hint?: string;
  containerClassName?: string;
}

export function Input({ label, hint, id, containerClassName = '', className = '', ...rest }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={containerClassName}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[10px] font-bold uppercase tracking-wider text-[var(--studio-text-muted)] mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full bg-[var(--studio-bg)] border border-[var(--studio-border)] rounded-xl px-3 py-2 text-xs text-[var(--studio-text-primary)] placeholder-[var(--studio-text-muted)] focus:outline-none focus:border-[var(--studio-accent)] transition-colors ${className}`}
        {...rest}
      />
      {hint && <p className="mt-1 text-[10px] text-[var(--studio-text-muted)]">{hint}</p>}
    </div>
  );
}
