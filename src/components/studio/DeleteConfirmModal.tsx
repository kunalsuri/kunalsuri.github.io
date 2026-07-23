import { useId } from 'preact/hooks';
import { Modal } from './ui/Modal.tsx';
import { Button } from './ui/Button.tsx';
import { Icon } from './ui/Icon.tsx';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  filename: string;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteConfirmModal({ isOpen, onClose, title, filename, onConfirm, isDeleting }: DeleteConfirmModalProps) {
  const headingId = useId();

  return (
    <Modal open={isOpen} onClose={onClose} size="sm" labelledBy={headingId}>
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
            <Icon name="trash" size={18} />
          </div>
          <div>
            <h3 id={headingId} className="font-bold text-base text-[var(--studio-text-primary)]">
              Delete Markdown File
            </h3>
            <p className="text-xs text-[var(--studio-text-muted)]">This operation cannot be undone.</p>
          </div>
        </div>

        <div className="p-3 bg-[var(--studio-bg)] border border-[var(--studio-border)] rounded-xl text-xs space-y-1">
          <div className="font-semibold truncate text-[var(--studio-text-primary)]">{title || 'Untitled Post'}</div>
          <div className="text-[11px] font-mono text-[var(--studio-accent)] truncate">src/content/blog/{filename}</div>
        </div>

        <p className="text-xs text-[var(--studio-text-secondary)] leading-relaxed">
          Are you sure you want to permanently delete this file from your local workspace disk?
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" icon="trash" loading={isDeleting} onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete File'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
