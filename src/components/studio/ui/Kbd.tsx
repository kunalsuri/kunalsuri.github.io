import type { ComponentChildren } from 'preact';

interface KbdProps {
  children: ComponentChildren;
  className?: string;
}

export function Kbd({ children, className = '' }: KbdProps) {
  return (
    <kbd
      className={`font-mono text-[10px] px-1.5 py-0.5 rounded border border-[var(--studio-border)] bg-[var(--studio-bg)] text-[var(--studio-text-muted)] ${className}`}
    >
      {children}
    </kbd>
  );
}
