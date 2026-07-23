import type { ComponentChildren } from 'preact';
import { Icon, type IconName } from './Icon.tsx';

interface EmptyStateProps {
  icon?: IconName;
  message: ComponentChildren;
}

export function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center text-xs text-[var(--studio-text-muted)]">
      {icon && (
        <span className="opacity-50">
          <Icon name={icon} size={22} />
        </span>
      )}
      <p>{message}</p>
    </div>
  );
}
