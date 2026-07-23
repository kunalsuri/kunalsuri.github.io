import { useEffect, useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';

export type ModalPlacement = 'center' | 'left' | 'right';
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  placement?: ModalPlacement;
  size?: ModalSize;
  /** id of the heading rendered inside `children` — native <dialog> does
   * not auto-wire this, unlike its free focus-trap/ESC handling. */
  labelledBy?: string;
  className?: string;
  children: ComponentChildren;
}

const CENTER_SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

// The <dialog> element itself always spans the full viewport (a flex
// container), for every placement — NOT just the panel's own footprint.
// That's what makes "click outside to close" work for edge-pinned drawers
// too: the clickable dismiss area is the dialog element's own box, so it
// has to cover the whole screen, with the panel merely aligned within it.
const WRAPPER_ALIGN_CLASSES: Record<ModalPlacement, string> = {
  center: 'items-center justify-center p-4',
  left: 'items-stretch justify-start',
  right: 'items-stretch justify-end',
};

const PANEL_SHAPE_CLASSES: Record<ModalPlacement, string> = {
  center: 'w-full rounded-2xl max-h-[85vh]',
  left: 'w-80 sm:w-96 h-full rounded-none',
  right: 'w-80 sm:w-96 h-full rounded-none',
};

const PANEL_ANIMATION_CLASSES: Record<ModalPlacement, string> = {
  center: 'animate-studio-fade',
  left: 'animate-studio-slide-right',
  right: 'animate-studio-slide-left',
};

/**
 * Shared dialog shell for every Studio modal/drawer, built on the native
 * <dialog> element rather than a hand-rolled div stack — that's what gets
 * focus-trap, focus-return-to-trigger, and top-layer stacking for free.
 * `Drawer.tsx` is a zero-logic wrapper over this with `placement` fixed to
 * an edge; everything that can go subtly wrong (lifecycle, backdrop click,
 * ESC) lives in exactly one place.
 */
export function Modal({ open, onClose, placement = 'center', size = 'md', labelledBy, className = '', children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // The declarative `<dialog open>` HTML attribute renders a plain
  // non-modal box — no top layer, no ::backdrop, no focus trap. All of
  // that only happens via the imperative showModal()/close() methods.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // ESC fires a cancelable 'cancel' event before the dialog closes itself.
  // Intercepting it keeps the `open` prop (owned by the caller) as the
  // single source of truth instead of the browser closing the dialog out
  // from under Preact's state.
  const handleCancel = (e: Event) => {
    e.preventDefault();
    onClose();
  };

  // Native <dialog> has no built-in "click outside to close" — clicking the
  // dimmed ::backdrop pseudo-element doesn't bubble a click to anything
  // meaningful. The trick is that the dialog element's own box already
  // spans the full viewport (see WRAPPER_ALIGN_CLASSES), so a click that
  // lands on the dialog element but outside the inner panel div *is* the
  // "backdrop" click. e.target === dialogEl is the naive check but breaks
  // the moment the dialog element gets padding/border of its own, so this
  // uses a bounding-rect hit-test instead (the panel's onClick below stops
  // propagation, so this only fires for genuine outside clicks).
  const handleBackdropClick = (e: MouseEvent) => {
    const dialog = dialogRef.current;
    if (!dialog || e.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    if (!inside) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className={`studio-dialog fixed flex ${WRAPPER_ALIGN_CLASSES[placement]}`}
      aria-labelledby={labelledBy}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      {open && (
        <div
          className={`flex flex-col overflow-hidden bg-[var(--studio-bg-secondary)] border border-[var(--studio-border)] shadow-2xl text-[var(--studio-text-primary)] ${PANEL_SHAPE_CLASSES[placement]} ${
            placement === 'center' ? CENTER_SIZE_CLASSES[size] : ''
          } ${PANEL_ANIMATION_CLASSES[placement]} ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </dialog>
  );
}
