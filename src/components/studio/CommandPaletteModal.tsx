import { useEffect, useId, useMemo, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { Modal } from './ui/Modal.tsx';
import { Kbd } from './ui/Kbd.tsx';
import { Icon, type IconName } from './ui/Icon.tsx';
import { EmptyState } from './ui/EmptyState.tsx';
import { useListNavigation } from './hooks/useListNavigation.ts';
import { THEME_OPTIONS, type StudioTheme } from './theme.ts';
import type { StudioPostSummary } from '../../utils/studio-fs.ts';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: StudioPostSummary[];
  onSelectPost: (slug: string) => void;
  onCreateNewPost: () => void;
  onOpenMetadata: () => void;
  onOpenStockPhotos: () => void;
  onSaveToDisk: () => void;
  onSetTheme: (theme: StudioTheme) => void;
  currentTheme: StudioTheme;
  autoSaveEnabled?: boolean;
  onToggleAutoSave?: () => void;
}

interface PaletteAction {
  kind: 'action';
  id: string;
  label: string;
  icon: IconName;
  isActive?: boolean;
  run: () => void;
}

interface PalettePost {
  kind: 'post';
  id: string;
  slug: string;
  title: string;
  filename: string;
}

type PaletteItem = PaletteAction | PalettePost;

/** Rebuilt on Modal + a shared useListNavigation — previously this was
 * mouse-only, which defeats the point of a Ctrl+K palette. Actions and
 * posts are two visual groups but one continuous keyboard-navigable list. */
export function CommandPaletteModal({
  isOpen,
  onClose,
  posts,
  onSelectPost,
  onCreateNewPost,
  onOpenMetadata,
  onOpenStockPhotos,
  onSaveToDisk,
  onSetTheme,
  currentTheme,
  autoSaveEnabled,
  onToggleAutoSave,
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState('');
  const headingId = useId();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) setQuery('');
  }, [isOpen]);

  const actions: PaletteAction[] = useMemo(
    () => [
      {
        kind: 'action',
        id: 'action-save',
        label: 'Save post file to disk',
        icon: 'save',
        run: () => {
          onSaveToDisk();
          onClose();
        },
      },
      ...(onToggleAutoSave
        ? [
            {
              kind: 'action' as const,
              id: 'action-autosave',
              label: autoSaveEnabled ? 'Turn Auto-Save OFF' : 'Turn Auto-Save ON',
              icon: 'check' as IconName,
              isActive: autoSaveEnabled,
              run: () => {
                onToggleAutoSave();
                onClose();
              },
            },
          ]
        : []),
      {
        kind: 'action',
        id: 'action-new',
        label: 'Create new post',
        icon: 'sparkles',
        run: () => {
          onCreateNewPost();
          onClose();
        },
      },
      {
        kind: 'action',
        id: 'action-meta',
        label: 'Open post metadata',
        icon: 'settings',
        run: () => {
          onOpenMetadata();
          onClose();
        },
      },
      {
        kind: 'action',
        id: 'action-stock',
        label: 'Search stock photos',
        icon: 'image',
        run: () => {
          onOpenStockPhotos();
          onClose();
        },
      },
      ...THEME_OPTIONS.map((t) => ({
        kind: 'action' as const,
        id: `theme-${t.value}`,
        label: `Switch theme: ${t.label}`,
        icon: t.icon,
        isActive: t.value === currentTheme,
        run: () => {
          onSetTheme(t.value);
          onClose();
        },
      })),
    ],
    [currentTheme, autoSaveEnabled, onToggleAutoSave, onSaveToDisk, onCreateNewPost, onOpenMetadata, onOpenStockPhotos, onSetTheme, onClose]
  );

  const filteredActions = useMemo(
    () => actions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase())),
    [actions, query]
  );

  const filteredPosts: PalettePost[] = useMemo(
    () =>
      posts
        .filter(
          (p) =>
            p.frontmatter.title.toLowerCase().includes(query.toLowerCase()) ||
            p.slug.toLowerCase().includes(query.toLowerCase())
        )
        .map((p) => ({
          kind: 'post' as const,
          id: `post-${p.slug}`,
          slug: p.slug,
          title: p.frontmatter.title || p.slug,
          filename: p.filename,
        })),
    [posts, query]
  );

  const items: PaletteItem[] = useMemo(() => [...filteredActions, ...filteredPosts], [filteredActions, filteredPosts]);

  const runItem = (index: number) => {
    const item = items[index];
    if (!item) return;
    if (item.kind === 'action') {
      item.run();
    } else {
      onSelectPost(item.slug);
      onClose();
    }
  };

  const { activeIndex, setActiveIndex, onKeyDown } = useListNavigation({
    itemCount: items.length,
    isOpen,
    onSelect: runItem,
    onClose,
  });

  useEffect(() => {
    listRef.current?.querySelector(`[data-palette-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  return (
    <Modal open={isOpen} onClose={onClose} placement="center" size="md" labelledBy={headingId} className="max-h-[70vh]">
      <h2 id={headingId} className="sr-only">
        Command palette
      </h2>
      <div className="p-4 border-b border-[var(--studio-border)] flex items-center gap-3">
        <Icon name="search" size={18} className="text-[var(--studio-text-muted)] shrink-0" />
        <input
          type="text"
          autoFocus
          value={query}
          onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
          onKeyDown={onKeyDown}
          placeholder="Type a command or search markdown files..."
          className="w-full bg-transparent text-sm text-[var(--studio-text-primary)] focus:outline-none placeholder:text-[var(--studio-text-muted)]"
        />
        <Kbd>ESC</Kbd>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-3 studio-custom-scroll">
        {filteredActions.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--studio-text-muted)] px-3 py-1">
              Quick Actions & Themes
            </div>
            <div className="space-y-0.5">
              {filteredActions.map((action, i) => (
                <PaletteRow
                  key={action.id}
                  index={i}
                  active={i === activeIndex}
                  onHover={() => setActiveIndex(i)}
                  onClick={() => runItem(i)}
                >
                  <Icon name={action.icon} size={15} />
                  <span className="flex-1">{action.label}</span>
                  {action.isActive && (
                    <span className="text-[10px] bg-[var(--studio-accent)] text-[var(--studio-bg)] px-2 py-0.5 rounded font-bold">
                      Active
                    </span>
                  )}
                </PaletteRow>
              ))}
            </div>
          </div>
        )}

        {filteredPosts.length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--studio-text-muted)] px-3 py-1">
              Markdown Files ({filteredPosts.length})
            </div>
            <div className="space-y-0.5">
              {filteredPosts.map((post, i) => {
                const index = filteredActions.length + i;
                return (
                  <PaletteRow
                    key={post.id}
                    index={index}
                    active={index === activeIndex}
                    onHover={() => setActiveIndex(index)}
                    onClick={() => runItem(index)}
                  >
                    <Icon name="folder" size={14} className="shrink-0 text-[var(--studio-text-muted)]" />
                    <span className="truncate flex-1 font-medium">{post.title}</span>
                    <span className="text-[10px] font-mono text-[var(--studio-text-muted)] shrink-0 ml-2">{post.filename}</span>
                  </PaletteRow>
                );
              })}
            </div>
          </div>
        )}

        {items.length === 0 && <EmptyState icon="search" message="No matching commands or files" />}
      </div>
    </Modal>
  );
}

interface PaletteRowProps {
  index: number;
  active: boolean;
  onHover: () => void;
  onClick: () => void;
  children: ComponentChildren;
}

function PaletteRow({ index, active, onHover, onClick, children }: PaletteRowProps) {
  return (
    <button
      type="button"
      data-palette-index={index}
      onMouseEnter={onHover}
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 transition-colors ${
        active
          ? 'bg-[var(--studio-accent-glow)] text-[var(--studio-accent)]'
          : 'text-[var(--studio-text-primary)] hover:bg-[var(--studio-accent-glow)] hover:text-[var(--studio-accent)]'
      }`}
    >
      {children}
    </button>
  );
}
