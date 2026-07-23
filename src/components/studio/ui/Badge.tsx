import type { ComponentChildren } from 'preact';

interface BadgeProps {
  tone: 'draft' | 'published';
  children?: ComponentChildren;
  className?: string;
}

export function Badge({ tone, children, className = '' }: BadgeProps) {
  const label = children ?? (tone === 'draft' ? 'Draft' : 'Published');
  const toneClass =
    tone === 'draft'
      ? 'bg-[var(--studio-badge-draft-bg)] text-[var(--studio-badge-draft-text)] border-[var(--studio-badge-draft-border)]'
      : 'bg-[var(--studio-badge-pub-bg)] text-[var(--studio-badge-pub-text)] border-[var(--studio-badge-pub-border)]';

  return (
    <span
      className={`inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${toneClass} ${className}`}
    >
      {label}
    </span>
  );
}
