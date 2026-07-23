import { useMemo, useRef, useState } from 'preact/hooks';
import { Button } from './ui/Button.tsx';
import { IconButton } from './ui/IconButton.tsx';
import { SegmentedControl } from './ui/SegmentedControl.tsx';
import { SlashMenu, SLASH_COMMANDS, type SlashCommandId } from './SlashMenu.tsx';
import { SelectionFloatingToolbar, type FormatType } from './SelectionFloatingToolbar.tsx';
import { useListNavigation } from './hooks/useListNavigation.ts';
import { renderPreviewHtml } from '../../utils/markdown-preview.ts';
import { sanitizeSlug } from '../../utils/slug.ts';

interface EditorCanvasProps {
  content: string;
  onChange: (newContent: string) => void;
  fontFamily: 'serif' | 'sans' | 'mono';
  /** Owned by StudioApp (alongside theme/fontFamily/Zen mode) and exposed
   * for adjustment through the header's AppearanceMenu — this component
   * only reads it to size the textarea. */
  fontSize: number;
  onOpenImageModal: () => void;
  onOpenShortcuts: () => void;
  isZenMode: boolean;
  activeSlug?: string;
}

type ViewMode = 'editor' | 'split';

const VIEW_MODE_OPTIONS: Array<{ value: ViewMode; label: string }> = [
  { value: 'editor', label: 'Canvas' },
  { value: 'split', label: 'Split Live Preview' },
];

export function EditorCanvas({
  content,
  onChange,
  fontFamily,
  fontSize,
  onOpenImageModal,
  onOpenShortcuts,
  isZenMode,
  activeSlug,
}: EditorCanvasProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [floatingToolbar, setFloatingToolbar] = useState<{
    visible: boolean;
    position: { top: number; left: number };
  }>({ visible: false, position: { top: 0, left: 0 } });
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const chars = content.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  const fontStyleClass = fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans';

  const assetBaseUrl = `/api/studio/assets/${sanitizeSlug(activeSlug || '') || 'general'}`;
  const previewHtml = useMemo(() => renderPreviewHtml(content, assetBaseUrl), [content, assetBaseUrl]);

  const insertTextAtCursor = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = `${prefix}${selectedText || 'Text'}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    onChange(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText.length || 4));
    }, 10);
  };

  const handleSelectionCheck = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start !== end && end - start > 0) {
      const rect = textarea.getBoundingClientRect();
      const lines = content.slice(0, start).split('\n');
      const lineCount = lines.length;
      const topPos = Math.max(rect.top + 20, Math.min(rect.top + lineCount * 24, rect.bottom - 40));
      const leftPos = rect.left + rect.width / 2;

      setFloatingToolbar({
        visible: true,
        position: { top: topPos, left: leftPos },
      });
    } else {
      setFloatingToolbar((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    }
  };

  const handleApplyFormat = (type: FormatType, urlArg?: string) => {
    setFloatingToolbar({ visible: false, position: { top: 0, left: 0 } });
    if (type === 'bold') insertTextAtCursor('**', '**');
    else if (type === 'italic') insertTextAtCursor('*', '*');
    else if (type === 'code') insertTextAtCursor('`', '`');
    else if (type === 'strikethrough') insertTextAtCursor('~~', '~~');
    else if (type === 'callout') insertTextAtCursor('> 💡 **Note**: ', '\n');
    else if (type === 'link' && urlArg) {
      insertTextAtCursor('[', `](${urlArg})`);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('slug', activeSlug || 'general');

      const res = await fetch('/api/studio/images/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.markdownSnippet) {
          insertTextAtCursor(`\n${data.markdownSnippet}\n`);
        }
      }
    } catch (err) {
      console.error('[Atelier Image Drop] Error uploading:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const executeSlashCommand = async (id: SlashCommandId) => {
    setShowSlashMenu(false);
    setSlashFilter('');
    if (id === 'image') {
      onOpenImageModal();
    } else if (id === 'bookmark') {
      const rawUrl = prompt('Enter webpage URL for visual Bookmark Card:');
      if (rawUrl && rawUrl.trim()) {
        try {
          const res = await fetch('/api/studio/unfurl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: rawUrl.trim() }),
          });
          const meta = await res.json();
          const bookmarkMarkdown = `\n[bookmark:${meta.title || rawUrl}](${meta.url || rawUrl} "${meta.domain || ''}|${meta.description || ''}|${meta.image || ''}")\n`;
          insertTextAtCursor(bookmarkMarkdown);
        } catch {
          insertTextAtCursor(`\n[${rawUrl}](${rawUrl})\n`);
        }
      }
    } else if (id === 'h2') {
      insertTextAtCursor('## ', '\n');
    } else if (id === 'h3') {
      insertTextAtCursor('### ', '\n');
    } else if (id === 'quote') {
      insertTextAtCursor('> ', '\n');
    } else if (id === 'code') {
      insertTextAtCursor('```typescript\n', '\n```\n');
    } else if (id === 'callout') {
      insertTextAtCursor('> 💡 **Note**: ', '\n');
    } else if (id === 'divider') {
      insertTextAtCursor('\n---\n');
    }
  };

  const filteredSlashCommands = showSlashMenu
    ? SLASH_COMMANDS.filter(
        (c) => c.keywords.includes(slashFilter.toLowerCase()) || c.label.toLowerCase().includes(slashFilter.toLowerCase())
      )
    : [];

  const slashNav = useListNavigation({
    itemCount: filteredSlashCommands.length,
    isOpen: showSlashMenu,
    onSelect: (index) => {
      const cmd = filteredSlashCommands[index];
      if (cmd) executeSlashCommand(cmd.id);
    },
    onClose: () => {
      setShowSlashMenu(false);
      setSlashFilter('');
    },
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!showSlashMenu) {
      if (e.key === '/') {
        const textarea = textareaRef.current;
        if (textarea) {
          const cursor = textarea.selectionStart;
          const textBefore = textarea.value.slice(0, cursor);
          const lastLine = textBefore.split('\n').pop() || '';
          if (lastLine.trim() === '') {
            e.preventDefault();
            setShowSlashMenu(true);
            setSlashFilter('');
          }
        }
      }
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (slashFilter === '') {
        setShowSlashMenu(false);
      } else {
        setSlashFilter((prev) => prev.slice(0, -1));
      }
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === 'Escape') {
      slashNav.onKeyDown(e);
      return;
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      setSlashFilter((prev) => prev + e.key);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--studio-bg)] text-[var(--studio-text-primary)] relative">
      {/* Top Formatting Toolbar */}
      {!isZenMode && (
        <div className="px-6 py-2.5 bg-[var(--studio-bg-card)] border-b border-[var(--studio-border)] backdrop-blur-md flex items-center justify-between gap-4 z-20 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => insertTextAtCursor('**', '**')} className="font-bold" title="Bold">
              B
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertTextAtCursor('*', '*')} className="italic" title="Italic">
              I
            </Button>
            <Button variant="ghost" size="sm" icon="link" onClick={() => insertTextAtCursor('[', '](https://)')}>
              Link
            </Button>
            <span className="h-4 w-px bg-[var(--studio-border)] mx-1" />
            <Button variant="ghost" size="sm" onClick={() => insertTextAtCursor('## ')} className="font-bold">
              H2
            </Button>
            <Button variant="ghost" size="sm" onClick={() => insertTextAtCursor('### ')} className="font-bold">
              H3
            </Button>
            <Button variant="ghost" size="sm" icon="quote" onClick={() => insertTextAtCursor('> ')}>
              Quote
            </Button>
            <Button variant="ghost" size="sm" icon="code" onClick={() => insertTextAtCursor('`', '`')} className="font-mono">
              Code
            </Button>
            <span className="h-4 w-px bg-[var(--studio-border)] mx-1" />
            <Button variant="secondary" size="sm" icon="image" onClick={onOpenImageModal}>
              Stock Photo Studio
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <SegmentedControl value={viewMode} onChange={setViewMode} options={VIEW_MODE_OPTIONS} size="sm" />
            <IconButton icon="help-circle" label="Keyboard shortcuts" size="sm" onClick={onOpenShortcuts} />
          </div>
        </div>
      )}

      {/* Selection Floating Formatting Toolbar */}
      <SelectionFloatingToolbar
        visible={floatingToolbar.visible}
        position={floatingToolbar.position}
        onApplyFormat={handleApplyFormat}
        onClose={() => setFloatingToolbar((prev) => ({ ...prev, visible: false }))}
      />

      {/* Editor Main Body */}
      <div className="flex-1 flex overflow-hidden relative">
        <div
          onDragOver={handleDragOver as any}
          onDrop={handleDrop as any}
          className={`flex-1 flex flex-col p-6 sm:p-12 overflow-y-auto studio-custom-scroll relative ${
            viewMode === 'split' ? 'w-1/2 border-r border-[var(--studio-border)]' : 'w-full'
          }`}
        >
          {isUploading && (
            <div className="absolute inset-0 bg-[var(--studio-bg-card)]/80 backdrop-blur-sm z-30 flex items-center justify-center gap-2 text-sm font-medium text-[var(--studio-accent)] animate-pulse">
              <span>Ingesting dropped image into local assets...</span>
            </div>
          )}

          <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col relative">
            <textarea
              ref={textareaRef}
              value={content}
              onInput={(e) => onChange((e.target as HTMLTextAreaElement).value)}
              onKeyDown={handleKeyDown}
              onSelect={handleSelectionCheck}
              onMouseUp={handleSelectionCheck}
              onKeyUp={handleSelectionCheck}
              placeholder="Start writing your markdown essay... (Type '/' for block commands)"
              style={{ fontSize: `${fontSize}px` }}
              className={`w-full flex-1 bg-transparent resize-none focus:outline-none leading-relaxed tracking-wide ${fontStyleClass} text-[var(--studio-text-primary)] placeholder-[var(--studio-text-muted)]`}
            />

            <SlashMenu
              isOpen={showSlashMenu}
              filter={slashFilter}
              commands={filteredSlashCommands}
              activeIndex={slashNav.activeIndex}
              onHover={slashNav.setActiveIndex}
              onSelect={(index) => {
                const cmd = filteredSlashCommands[index];
                if (cmd) executeSlashCommand(cmd.id);
              }}
            />
          </div>
        </div>

        {viewMode === 'split' && (
          <div className="w-1/2 p-6 sm:p-12 overflow-y-auto bg-[var(--studio-bg-secondary)] studio-custom-scroll">
            <div className="text-[10px] uppercase tracking-widest text-[var(--studio-accent)] font-bold mb-4 pb-2 border-b border-[var(--studio-border)] flex items-center justify-between">
              <span>Live Formatted Preview</span>
              <span className="font-mono text-[9px] text-[var(--studio-text-muted)]">Rendered Markdown</span>
            </div>
            {content.trim() ? (
              <div className={`prose ${fontStyleClass}`} dangerouslySetInnerHTML={{ __html: previewHtml }} />
            ) : (
              <p className="text-[var(--studio-text-muted)] italic text-sm">Live preview will update as you write...</p>
            )}
          </div>
        )}
      </div>

      {/* Footer Ambient Statistics Bar */}
      <div className="px-6 py-2 bg-[var(--studio-bg-card)] border-t border-[var(--studio-border)] flex items-center justify-between text-xs text-[var(--studio-text-muted)] z-20">
        <div className="flex items-center gap-4">
          <span>{words.toLocaleString()} words</span>
          <span className="w-1 h-1 rounded-full bg-[var(--studio-border)]" />
          <span>{chars.toLocaleString()} characters</span>
          <span className="w-1 h-1 rounded-full bg-[var(--studio-border)]" />
          <span>{readingTimeMinutes} min read</span>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[11px]">
          <span>
            Type <kbd className="font-mono bg-[var(--studio-bg)] px-1 py-0.5 rounded border border-[var(--studio-border)]">/</kbd> for
            blocks
          </span>
          <span>
            Press <kbd className="font-mono bg-[var(--studio-bg)] px-1 py-0.5 rounded border border-[var(--studio-border)]">Ctrl+K</kbd>{' '}
            for command palette
          </span>
        </div>
      </div>
    </div>
  );
}
