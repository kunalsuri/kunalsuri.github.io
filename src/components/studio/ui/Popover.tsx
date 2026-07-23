import { useEffect, useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  /** The trigger element — rendered by the caller (so it can own its own
   * icon/label/aria-expanded) inside the same positioning container as the
   * panel, unlike Modal's full-viewport <dialog>. */
  anchor: ComponentChildren;
  align?: 'left' | 'right';
  className?: string;
  children: ComponentChildren;
}

/**
 * A light, anchored disclosure panel — deliberately not built on Modal:
 * Modal's native <dialog> dims the whole screen and is meant for a focused
 * task (editing metadata, confirming a delete). This is for a quick, low-
 * commitment adjustment made without looking away from the page, closer to
 * SlashMenu's existing CSS-anchored positioning than to a modal dialog.
 * Positioning is plain `absolute` off a `relative` wrapper (the same trick
 * SlashMenu already uses) rather than JS-computed coordinates, so there's no
 * new dependency and no viewport-flipping logic to get wrong.
 */
export function Popover({ open, onClose, anchor, align = 'right', className = '', children }: PopoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <div ref={containerRef} className="relative inline-block">
      {anchor}
      {open && (
        <div
          role="menu"
          aria-label="Appearance settings"
          className={`absolute top-full mt-2 z-40 rounded-2xl border border-[var(--studio-border)] bg-[var(--studio-bg-secondary)] shadow-2xl backdrop-blur-xl animate-studio-fade text-[var(--studio-text-primary)] ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${className}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
