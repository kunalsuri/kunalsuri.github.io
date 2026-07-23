import { useId } from 'preact/hooks';
import type { TextareaHTMLAttributes } from 'preact';

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'label'> {
  label?: string;
  hint?: string;
  containerClassName?: string;
}

export function Textarea({ label, hint, id, containerClassName = '', className = '', ...rest }: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;

  return (
    <div className={containerClassName}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-[10px] font-bold uppercase tracking-wider text-[var(--studio-text-muted)] mb-1.5"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`w-full bg-[var(--studio-bg)] border border-[var(--studio-border)] rounded-xl px-3 py-2 text-xs text-[var(--studio-text-secondary)] placeholder-[var(--studio-text-muted)] focus:outline-none focus:border-[var(--studio-accent)] transition-colors resize-none ${className}`}
        {...rest}
      />
      {hint && <p className="mt-1 text-[10px] text-[var(--studio-text-muted)]">{hint}</p>}
    </div>
  );
}
