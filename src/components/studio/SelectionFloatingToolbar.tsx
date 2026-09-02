import { useState } from 'preact/hooks';
import { Icon, type IconName } from './ui/Icon.tsx';

export type FormatType = 'bold' | 'italic' | 'code' | 'link' | 'strikethrough' | 'callout';

interface SelectionFloatingToolbarProps {
  visible: boolean;
  position: { top: number; left: number };
  onApplyFormat: (type: FormatType, url?: string) => void;
  onClose: () => void;
}

export function SelectionFloatingToolbar({
  visible,
  position,
  onApplyFormat,
  onClose,
}: SelectionFloatingToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  if (!visible) return null;

  const handleLinkSubmit = (e: Event) => {
    e.preventDefault();
    if (linkUrl.trim()) {
      onApplyFormat('link', linkUrl.trim());
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  return (
    <div
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      className="fixed z-50 -translate-x-1/2 -translate-y-full mb-2 flex items-center gap-1 rounded-xl border border-[var(--studio-border)] bg-[var(--studio-bg-card)]/95 p-1.5 shadow-2xl backdrop-blur-md transition-all duration-150 animate-in fade-in zoom-in-95"
    >
      {showLinkInput ? (
        <form onSubmit={handleLinkSubmit} className="flex items-center gap-1.5 px-1">
          <input
            type="url"
            value={linkUrl}
            onInput={(e) => setLinkUrl((e.target as HTMLInputElement).value)}
            placeholder="Paste or type URL..."
            className="w-48 rounded-md border border-[var(--studio-border)] bg-[var(--studio-bg)] px-2 py-1 text-xs text-[var(--studio-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--studio-accent)] font-mono"
            autoFocus
          />
          <button
            type="submit"
            className="rounded-md bg-[var(--studio-accent)] px-2 py-1 text-xs font-medium text-white hover:opacity-90 transition-opacity"
          >
            Add Link
          </button>
          <button
            type="button"
            onClick={() => setShowLinkInput(false)}
            className="rounded-md p-1 text-[var(--studio-text-muted)] hover:text-[var(--studio-text-primary)]"
          >
            <Icon name="close" size={14} />
          </button>
        </form>
      ) : (
        <>
          <ToolbarButton
            icon="bold"
            label="Bold"
            onClick={() => onApplyFormat('bold')}
          />
          <ToolbarButton
            icon="italic"
            label="Italic"
            onClick={() => onApplyFormat('italic')}
          />
          <ToolbarButton
            icon="code"
            label="Inline Code"
            onClick={() => onApplyFormat('code')}
          />
          <ToolbarButton
            icon="link"
            label="Insert Link"
            onClick={() => setShowLinkInput(true)}
          />
          <ToolbarButton
            icon="strikethrough"
            label="Strikethrough"
            onClick={() => onApplyFormat('strikethrough')}
          />
          <ToolbarButton
            icon="lightbulb"
            label="Callout Quote"
            onClick={() => onApplyFormat('callout')}
          />
          <div className="mx-0.5 h-4 w-[1px] bg-[var(--studio-border)]" />
          <button
            type="button"
            onClick={onClose}
            title="Dismiss"
            className="rounded-md p-1 text-[var(--studio-text-muted)] hover:text-[var(--studio-text-primary)] hover:bg-[var(--studio-bg)]"
          >
            <Icon name="close" size={14} />
          </button>
        </>
      )}
    </div>
  );
}

function ToolbarButton({
  icon,
  label,
  onClick,
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex items-center justify-center rounded-lg p-1.5 text-[var(--studio-text-muted)] hover:bg-[var(--studio-bg)] hover:text-[var(--studio-accent)] transition-colors"
    >
      <Icon name={icon} size={15} />
    </button>
  );
}
