import type { ComponentChildren } from 'preact';
import { Icon } from './Icon.tsx';

export type ToastTone = 'error' | 'success' | 'info';

interface ToastProps {
  tone: ToastTone;
  message: ComponentChildren;
  onDismiss: () => void;
}

const TONE_CLASSES: Record<ToastTone, string> = {
  error: 'border-red-500/40 text-red-50 bg-red-950/95',
  success: 'border-[var(--studio-badge-pub-border)] text-[var(--studio-text-primary)] bg-[var(--studio-bg-card)]',
  info: 'border-[var(--studio-border)] text-[var(--studio-text-primary)] bg-[var(--studio-bg-card)]',
};

export function Toast({ tone, message, onDismiss }: ToastProps) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-xs shadow-lg backdrop-blur-md pointer-events-auto ${TONE_CLASSES[tone]}`}
    >
      <span className="flex-1 leading-relaxed">{message}</span>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={onDismiss}
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
      >
        <Icon name="close" size={13} />
      </button>
    </div>
  );
}
