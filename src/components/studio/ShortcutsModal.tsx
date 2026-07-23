import { useId } from 'preact/hooks';
import { Modal } from './ui/Modal.tsx';
import { IconButton } from './ui/IconButton.tsx';
import { Kbd } from './ui/Kbd.tsx';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS: Array<{ label: string; keys: string }> = [
  { label: 'Save to disk', keys: 'Ctrl + S' },
  { label: 'Command palette', keys: 'Ctrl + K' },
  { label: 'Navigate results', keys: '↑ ↓' },
  { label: 'Run highlighted item', keys: 'Enter' },
  { label: 'Insert block (headings, quotes, images…)', keys: '/' },
  { label: 'Exit Zen mode', keys: 'Esc' },
];

/** Extracted from EditorCanvas.tsx, where this was previously an inline
 * from-scratch backdrop/panel — one of six independent copies of the same
 * modal chrome across Studio, now built on the shared Modal primitive. */
export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  const headingId = useId();

  return (
    <Modal open={isOpen} onClose={onClose} size="sm" labelledBy={headingId}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--studio-border)] pb-3">
          <h3 id={headingId} className="font-bold text-sm text-[var(--studio-text-primary)]">
            Keyboard Shortcuts
          </h3>
          <IconButton icon="close" label="Close" size="sm" onClick={onClose} />
        </div>
        <div className="space-y-2 text-xs">
          {SHORTCUTS.map((s) => (
            <div
              key={s.label}
              className="flex items-center justify-between gap-4 py-1 border-b border-[var(--studio-border)] last:border-0"
            >
              <span className="text-[var(--studio-text-secondary)]">{s.label}</span>
              <Kbd>{s.keys}</Kbd>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
