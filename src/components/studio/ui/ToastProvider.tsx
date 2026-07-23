import { createContext } from 'preact';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { Toast, type ToastTone } from './Toast.tsx';

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const AUTO_DISMISS_MS = 5000;

/** Replaces every alert() call in Studio with non-blocking, dismissible
 * notifications. Plain Preact context + a fixed-position stack — three call
 * sites don't justify an external toast dependency. */
export function ToastProvider({ children }: { children: ComponentChildren }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const stackRef = useRef<HTMLDivElement>(null);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, tone, message }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss]
  );

  // Modal/Drawer are native <dialog> elements, which render in the
  // browser's top layer — a stacking context that sits above the normal
  // DOM regardless of z-index. A plain `fixed` toast stack would render
  // *underneath* any open dialog (e.g. a failed-delete toast fired from
  // inside DeleteConfirmModal would be invisible behind it). `popover`
  // joins the same top layer, so toasts can render above dialogs too — but
  // top-layer order is "most recently shown wins," not DOM order, so the
  // popover is re-shown on every new toast to stay above whatever dialog
  // happens to be open at that moment.
  useEffect(() => {
    const el = stackRef.current;
    if (!el || toasts.length === 0) return;
    if (el.matches(':popover-open')) el.hidePopover();
    el.showPopover();
  }, [toasts]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        ref={stackRef}
        popover="manual"
        className="fixed bottom-4 right-4 m-0 flex w-full max-w-sm flex-col gap-2 border-0 bg-transparent p-0 pointer-events-none"
      >
        {toasts.map((t) => (
          <Toast key={t.id} tone={t.tone} message={t.message} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
