import { useEffect, useState } from 'preact/hooks';
import { EditorCanvas } from './EditorCanvas.tsx';
import { MetadataDrawer } from './MetadataDrawer.tsx';
import { StockImageModal } from './StockImageModal.tsx';
import { PostSidebar } from './PostSidebar.tsx';
import { CommandPaletteModal } from './CommandPaletteModal.tsx';
import { DeleteConfirmModal } from './DeleteConfirmModal.tsx';
import { ShortcutsModal } from './ShortcutsModal.tsx';
import { ToastProvider } from './ui/ToastProvider.tsx';
import { Button } from './ui/Button.tsx';
import { Icon } from './ui/Icon.tsx';
import { Badge } from './ui/Badge.tsx';
import { Kbd } from './ui/Kbd.tsx';
import { AppearanceMenu, type FontFamily } from './AppearanceMenu.tsx';
import { useStudioPosts } from './hooks/useStudioPosts.ts';
import { useLocalStorageState } from './hooks/useLocalStorageState.ts';
import { useLatestRef } from './hooks/useLatestRef.ts';
import { DEFAULT_THEME, isStudioTheme, type StudioTheme } from './theme.ts';
import { sanitizeSlug } from '../../utils/slug.ts';

export function StudioApp() {
  return (
    <ToastProvider>
      <StudioAppInner />
    </ToastProvider>
  );
}

function StudioAppInner() {
  const {
    posts,
    activeSlug,
    frontmatter,
    content,
    saveStatus,
    autoSaveEnabled,
    isDeleting,
    loadPost,
    createNewPost,
    updateContent,
    updateFrontmatter,
    updateSlug,
    save,
    remove,
    toggleAutoSave,
  } = useStudioPosts();

  const [theme, setTheme] = useLocalStorageState<StudioTheme>('atelier_studio_theme', DEFAULT_THEME, isStudioTheme);

  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  const [isStockImageOpen, setIsStockImageOpen] = useState(false);
  const [isPostSidebarOpen, setIsPostSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [fontFamily, setFontFamily] = useState<FontFamily>('serif');
  const [fontSize, setFontSize] = useState(18); // 14 to 26px

  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    slug: string;
    title: string;
    filename: string;
  }>({ isOpen: false, slug: '', title: '', filename: '' });

  // TODO(owner): wordGoal is currently read-only — defaults to 800, never
  // persisted, no UI to change it (the meter below implies it's
  // adjustable; it isn't). Pick one:
  //
  //   A) Simplest: `const [wordGoal, setWordGoal] = useState<number>(800);`
  //      then add UI that calls setWordGoal. Resets to 800 every session.
  //
  //   B) Recommended — reuse the same persistence hook as theme:
  //      `const [wordGoal, setWordGoal] = useLocalStorageState<number>('atelier_studio_word_goal', 800);`
  //      Sticks across sessions, costs ~1 line since the hook already
  //      exists above. UI touchpoint: make the "Writing Goal: X / Y words"
  //      pill below clickable — cycle through presets
  //      [300, 500, 800, 1200, 2000], or swap in a small <input type="number">.
  //
  //   C) Per-post goal via a new `BlogFrontmatter.wordGoal?: number` field —
  //      lets a 2000-word essay and a 300-word note have different
  //      targets. Touches content.config.ts's Zod schema; only reach for
  //      this if per-post goals are an actual want, not just "unstick 800".
  const [wordGoal] = useState<number>(800);

  const saveRef = useLatestRef(save);
  const isZenModeRef = useLatestRef(isZenMode);

  // Registered once — the previous version listed `content`/`frontmatter`/
  // etc. in its dependency array, which (since content changes on every
  // keystroke) tore down and re-added this window listener on every single
  // character typed. Reading current values through refs means the
  // listener itself never needs to change.
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void saveRef.current();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isZenModeRef.current) {
        setIsZenMode(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleInsertImageSnippet = (snippet: string) => {
    updateContent(`${content}\n\n${snippet}\n`);
  };

  const handleConfirmDelete = async () => {
    const { slug } = deleteModalState;
    if (!slug) return;
    const success = await remove(slug);
    if (success) {
      setDeleteModalState({ isOpen: false, slug: '', title: '', filename: '' });
    }
  };

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const wordProgress = Math.min(100, Math.round((words / wordGoal) * 100));

  return (
    <div
      className={`h-screen w-screen flex flex-col overflow-hidden font-sans selection:bg-[var(--studio-accent)] selection:text-[var(--studio-bg)] theme-${theme} bg-[var(--studio-bg)] text-[var(--studio-text-primary)] transition-colors duration-200`}
    >
      {!isZenMode && (
        <header className="h-14 px-4 sm:px-6 bg-[var(--studio-bg-card)] border-b border-[var(--studio-border)] flex items-center justify-between z-30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" icon="folder" onClick={() => setIsPostSidebarOpen(true)}>
              <span className="hidden sm:inline">Files</span>
            </Button>

            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="p-2 rounded-xl bg-[var(--studio-bg)] hover:bg-[var(--studio-border)] text-[var(--studio-text-secondary)] hover:text-[var(--studio-text-primary)] transition-all flex items-center gap-1.5 border border-[var(--studio-border)] shadow-sm"
              title="Command Palette (Ctrl+K)"
            >
              <Icon name="search" size={14} />
              <span className="hidden md:inline">
                <Kbd className="text-[var(--studio-accent)]">Ctrl+K</Kbd>
              </span>
            </button>

            <a href="/" className="eyebrow text-[var(--studio-accent)] hover:opacity-80 transition-opacity flex items-center">
              Atelier Studio
            </a>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 max-w-sm truncate">
              <span className="text-xs font-bold truncate text-[var(--studio-text-primary)]">{frontmatter.title}</span>
              <Badge tone={frontmatter.draft ? 'draft' : 'published'} />
            </div>

            <div
              className="flex items-center gap-2 bg-[var(--studio-bg)] border border-[var(--studio-border)] px-2.5 py-1 rounded-xl"
              title={`Writing Goal: ${words} / ${wordGoal} words (${wordProgress}%)`}
            >
              <div className="w-16 h-1.5 bg-[var(--studio-border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--studio-accent)] transition-all duration-300"
                  style={{ width: `${wordProgress}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-[var(--studio-text-muted)]">{wordProgress}%</span>
            </div>

            <a
              href={`/blog/${sanitizeSlug(activeSlug)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[var(--studio-text-muted)] hover:text-[var(--studio-accent)] transition-colors flex items-center gap-1"
              title="Open active post on local website"
            >
              <Icon name="external-link" size={12} /> Preview
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleAutoSave}
              className={`px-2.5 py-1 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
                autoSaveEnabled
                  ? 'bg-[var(--studio-accent-glow)] border-[var(--studio-accent)] text-[var(--studio-accent)] font-medium'
                  : 'bg-[var(--studio-bg)] border-[var(--studio-border)] text-[var(--studio-text-muted)] hover:text-[var(--studio-text-secondary)]'
              }`}
              title={
                autoSaveEnabled
                  ? 'Auto-Save is ON (Saves automatically 3s after typing pause)'
                  : 'Auto-Save is OFF (Click or press Ctrl+S to save)'
              }
            >
              <span className={`w-2 h-2 rounded-full ${autoSaveEnabled ? 'bg-[var(--studio-accent)] animate-pulse' : 'bg-gray-400'}`} />
              <span className="hidden md:inline">Auto-Save</span>
            </button>

            <AppearanceMenu
              theme={theme}
              onThemeChange={setTheme}
              fontFamily={fontFamily}
              onFontFamilyChange={setFontFamily}
              fontSize={fontSize}
              onFontSizeChange={setFontSize}
              onEnterZenMode={() => setIsZenMode(true)}
            />

            <Button variant="secondary" icon="settings" onClick={() => setIsMetadataOpen(true)}>
              <span className="hidden sm:inline">Metadata</span>
            </Button>

            <Button
              variant={saveStatus === 'saved' ? 'secondary' : 'primary'}
              icon={saveStatus === 'saved' ? 'check' : 'save'}
              loading={saveStatus === 'saving'}
              onClick={() => void save()}
              className="uppercase tracking-wider"
            >
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save (Ctrl+S)'}
            </Button>
          </div>
        </header>
      )}

      {isZenMode && (
        <Button
          variant="secondary"
          onClick={() => setIsZenMode(false)}
          className="fixed top-4 right-4 z-50 backdrop-blur-md shadow-lg"
        >
          Exit Zen Mode (Esc)
        </Button>
      )}

      <main className="flex-1 flex overflow-hidden relative">
        <EditorCanvas
          content={content}
          onChange={updateContent}
          fontFamily={fontFamily}
          fontSize={fontSize}
          onOpenImageModal={() => setIsStockImageOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          isZenMode={isZenMode}
          activeSlug={activeSlug}
        />
      </main>

      <MetadataDrawer
        isOpen={isMetadataOpen}
        onClose={() => setIsMetadataOpen(false)}
        frontmatter={frontmatter}
        onChange={updateFrontmatter}
        activeSlug={activeSlug}
        onSlugChange={updateSlug}
      />

      <StockImageModal
        isOpen={isStockImageOpen}
        onClose={() => setIsStockImageOpen(false)}
        slug={activeSlug}
        onInsertImage={handleInsertImageSnippet}
      />

      <PostSidebar
        isOpen={isPostSidebarOpen}
        onClose={() => setIsPostSidebarOpen(false)}
        posts={posts}
        activeSlug={activeSlug}
        onSelectPost={loadPost}
        onCreateNewPost={createNewPost}
        onOpenDeleteModal={(slug, title, filename) => setDeleteModalState({ isOpen: true, slug, title, filename })}
      />

      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        posts={posts}
        onSelectPost={loadPost}
        onCreateNewPost={createNewPost}
        onOpenMetadata={() => setIsMetadataOpen(true)}
        onOpenStockPhotos={() => setIsStockImageOpen(true)}
        onSaveToDisk={() => void save()}
        onSetTheme={setTheme}
        currentTheme={theme}
        autoSaveEnabled={autoSaveEnabled}
        onToggleAutoSave={toggleAutoSave}
      />

      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />

      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, slug: '', title: '', filename: '' })}
        title={deleteModalState.title}
        filename={deleteModalState.filename}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
