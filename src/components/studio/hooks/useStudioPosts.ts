import { useEffect, useState } from 'preact/hooks';
import { useToast } from '../ui/ToastProvider.tsx';
import type { StudioPostSummary } from '../../../utils/studio-fs.ts';
import type { BlogFrontmatter } from '../../../utils/frontmatter.ts';

const DEFAULT_FRONTMATTER: BlogFrontmatter = {
  title: 'Untitled Essay',
  description: '',
  pubDate: new Date().toISOString().split('T')[0],
  category: 'Essays',
  tags: ['Writing'],
  draft: true,
};

type SaveStatus = 'saved' | 'unsaved' | 'saving';

interface PostApiResponse {
  posts?: StudioPostSummary[];
  slug?: string;
}

/**
 * Owns the posts list plus whichever post is currently loaded in the
 * editor, and every API call against /api/studio/posts (fetch/create/load/
 * save/delete) — the "posts domain" slice that used to live directly in
 * StudioApp.tsx alongside unrelated UI-chrome state (modal visibility, zen
 * mode, theme). Failures report through useToast() instead of alert().
 *
 * `GET /api/studio/posts` always returns every post's full content (see
 * studio-fs.ts), so `loadPost` is a synchronous local lookup — there's no
 * separate per-slug fetch, which also sidesteps a real routing limitation:
 * this repo has no server adapter, and Astro's dev server can't reliably
 * serve a parameterized GET/DELETE (query string or dynamic path) under
 * that config without one.
 */
export function useStudioPosts() {
  const { showToast } = useToast();

  const [posts, setPosts] = useState<StudioPostSummary[]>([]);
  const [activeSlug, setActiveSlugState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('atelier_studio_active_slug') || 'new-essay';
    }
    return 'new-essay';
  });

  const [autoSaveEnabled, setAutoSaveEnabledState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('atelier_studio_autosave');
      if (saved !== null) return saved === 'true';
    }
    return false;
  });

  const [oldSlug, setOldSlug] = useState<string | undefined>(undefined);
  const [frontmatter, setFrontmatter] = useState<BlogFrontmatter>(DEFAULT_FRONTMATTER);
  const [content, setContent] = useState('# Untitled Essay\n\nStart writing here...');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [isDeleting, setIsDeleting] = useState(false);

  const setActiveSlug = (slug: string) => {
    setActiveSlugState(slug);
    if (typeof window !== 'undefined') {
      localStorage.setItem('atelier_studio_active_slug', slug);
    }
  };

  const setAutoSaveEnabled = (enabled: boolean) => {
    setAutoSaveEnabledState(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('atelier_studio_autosave', String(enabled));
    }
  };

  const toggleAutoSave = () => {
    setAutoSaveEnabled(!autoSaveEnabled);
  };

  const refreshList = async (): Promise<StudioPostSummary[]> => {
    const res = await fetch('/api/studio/posts');
    if (!res.ok) return [];
    const data: PostApiResponse = await res.json();
    const list = data.posts ?? [];
    setPosts(list);
    return list;
  };

  const applyPost = (post: StudioPostSummary) => {
    setActiveSlug(post.slug);
    setOldSlug(post.slug);
    setFrontmatter(post.frontmatter);
    setContent(post.content);
    setSaveStatus('saved');
  };

  const loadPost = (slug: string) => {
    const post = posts.find((p) => p.slug === slug);
    if (!post) {
      showToast('Could not find that post.', 'error');
      return;
    }
    applyPost(post);
  };

  // Runs once on mount: populate the list, restoring last active post if found.
  useEffect(() => {
    void (async () => {
      const list = await refreshList();
      if (list.length > 0) {
        const savedSlug = typeof window !== 'undefined' ? localStorage.getItem('atelier_studio_active_slug') : null;
        const matchingPost = list.find((p) => p.slug === savedSlug);
        if (matchingPost) {
          applyPost(matchingPost);
        } else {
          applyPost(list[0]);
        }
      }
    })();
  }, []);

  const createNewPost = () => {
    const newSlug = `essay-${Date.now().toString().slice(-4)}`;
    setActiveSlug(newSlug);
    setOldSlug(undefined);
    setFrontmatter({
      ...DEFAULT_FRONTMATTER,
      title: 'New Essay',
      pubDate: new Date().toISOString().split('T')[0],
    });
    setContent('# New Essay\n\nWrite your thoughts here...');
    setSaveStatus('saved');
  };

  const updateContent = (newContent: string) => {
    setContent(newContent);
    setSaveStatus('unsaved');

    const h1Match = newContent.match(/^#\s+(.+)$/m);
    const extractedTitle = h1Match?.[1]?.trim();
    if (extractedTitle && extractedTitle !== frontmatter.title) {
      setFrontmatter((prev) => ({ ...prev, title: extractedTitle }));
    }
  };

  const updateFrontmatter = (updated: BlogFrontmatter) => {
    setFrontmatter(updated);
    setSaveStatus('unsaved');

    if (updated.title && content.startsWith('# ')) {
      setContent(content.replace(/^#\s+.+$/m, `# ${updated.title}`));
    }
  };

  const updateSlug = (newSlug: string) => {
    setActiveSlug(newSlug);
    setSaveStatus('unsaved');
  };

  const save = async () => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/studio/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: activeSlug, frontmatter, content, oldSlug }),
      });

      if (!res.ok) {
        showToast('Failed to save the post to disk.', 'error');
        setSaveStatus('unsaved');
        return;
      }

      const data: PostApiResponse = await res.json();
      if (data.slug) {
        setActiveSlug(data.slug);
        setOldSlug(data.slug);
        setSaveStatus('saved');
        await refreshList();
      }
    } catch (err) {
      console.error('Save post error:', err);
      showToast('Error saving post.', 'error');
      setSaveStatus('unsaved');
    }
  };

  // Autosave: only runs when enabled by user, after 3s pause in typing.
  useEffect(() => {
    if (!autoSaveEnabled) return;
    if (saveStatus !== 'unsaved') return;
    if (oldSlug !== undefined && activeSlug !== oldSlug) return;
    const timer = setTimeout(() => {
      void save();
    }, 3000);
    return () => clearTimeout(timer);
  }, [autoSaveEnabled, content, frontmatter, activeSlug, oldSlug, saveStatus]);

  // Autosave closes most of the gap, but not the window before it
  // fires — this is the backstop for closing the tab/refreshing during
  // that window (or while a save is still in flight).
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus !== 'saved') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  const remove = async (slug: string): Promise<boolean> => {
    setIsDeleting(true);
    try {
      const res = await fetch('/api/studio/posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) {
        showToast('Failed to delete the post file.', 'error');
        return false;
      }

      const remaining = await refreshList();
      if (remaining.length > 0) {
        applyPost(remaining[0]);
      } else {
        createNewPost();
      }
      return true;
    } catch (err) {
      console.error('Error deleting post:', err);
      showToast('Error deleting post.', 'error');
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    posts,
    activeSlug,
    oldSlug,
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
    setAutoSaveEnabled,
    toggleAutoSave,
  };
}
