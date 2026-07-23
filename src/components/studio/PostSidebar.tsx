import { useId, useState } from 'preact/hooks';
import { Drawer } from './ui/Drawer.tsx';
import { Input } from './ui/Input.tsx';
import { Button } from './ui/Button.tsx';
import { IconButton } from './ui/IconButton.tsx';
import { SegmentedControl } from './ui/SegmentedControl.tsx';
import { Badge } from './ui/Badge.tsx';
import { EmptyState } from './ui/EmptyState.tsx';
import { Icon } from './ui/Icon.tsx';
import type { StudioPostSummary } from '../../utils/studio-fs.ts';

interface PostSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  posts: StudioPostSummary[];
  activeSlug: string;
  onSelectPost: (slug: string) => void;
  onCreateNewPost: () => void;
  onOpenDeleteModal: (slug: string, title: string, filename: string) => void;
}

type Filter = 'all' | 'drafts' | 'published';

export function PostSidebar({
  isOpen,
  onClose,
  posts,
  activeSlug,
  onSelectPost,
  onCreateNewPost,
  onOpenDeleteModal,
}: PostSidebarProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const headingId = useId();

  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      p.frontmatter.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      p.filename.toLowerCase().includes(search.toLowerCase());

    if (filter === 'drafts') return matchesSearch && p.frontmatter.draft;
    if (filter === 'published') return matchesSearch && !p.frontmatter.draft;
    return matchesSearch;
  });

  const filterOptions = [
    { value: 'all' as const, label: 'All', count: posts.length },
    { value: 'drafts' as const, label: 'Drafts', count: posts.filter((p) => p.frontmatter.draft).length },
    { value: 'published' as const, label: 'Published', count: posts.filter((p) => !p.frontmatter.draft).length },
  ];

  return (
    <Drawer open={isOpen} onClose={onClose} side="left" labelledBy={headingId}>
      <div className="flex flex-col h-full p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--studio-border)]">
          <div>
            <div className="flex items-center gap-2">
              <Icon name="folder" size={18} className="text-[var(--studio-accent)]" />
              <h2 id={headingId} className="text-base font-bold tracking-tight text-[var(--studio-text-primary)]">
                Blog Folder Markdowns
              </h2>
            </div>
            <p className="text-[11px] font-mono text-[var(--studio-accent)] mt-0.5">src/content/blog/</p>
          </div>
          <IconButton icon="close" label="Close sidebar" onClick={onClose} />
        </div>

        <Button
          variant="primary"
          icon="sparkles"
          onClick={() => {
            onCreateNewPost();
            onClose();
          }}
          className="w-full uppercase tracking-wider"
        >
          Create New Markdown Post
        </Button>

        <div className="space-y-2">
          <Input
            value={search}
            onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
            placeholder="Filter files or titles..."
          />
          <SegmentedControl value={filter} onChange={setFilter} options={filterOptions} size="sm" fullWidth />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 studio-custom-scroll">
          {filteredPosts.length === 0 ? (
            <EmptyState icon="folder" message="No matching posts in src/content/blog/" />
          ) : (
            filteredPosts.map((p) => (
              <div
                key={p.slug}
                className={`p-3.5 rounded-xl border transition-all relative group ${
                  p.slug === activeSlug
                    ? 'bg-[var(--studio-accent-glow)] border-[var(--studio-accent)] shadow-md'
                    : 'bg-[var(--studio-bg)] border-[var(--studio-border)] hover:border-[var(--studio-border-hover)]'
                }`}
              >
                <div
                  onClick={() => {
                    onSelectPost(p.slug);
                    onClose();
                  }}
                  className="cursor-pointer space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className={`text-xs font-bold line-clamp-1 ${
                        p.slug === activeSlug ? 'text-[var(--studio-accent)]' : 'text-[var(--studio-text-primary)]'
                      }`}
                    >
                      {p.frontmatter.title || p.slug}
                    </h3>
                    <Badge tone={p.frontmatter.draft ? 'draft' : 'published'} />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[var(--studio-text-muted)]">
                    <span className="font-mono text-[10px] bg-[var(--studio-bg-secondary)] px-1.5 py-0.5 rounded border border-[var(--studio-border)]">
                      {p.filename}
                    </span>
                    <span>{p.frontmatter.pubDate || 'No date'}</span>
                  </div>

                  {p.frontmatter.description && (
                    <p className="text-[11px] text-[var(--studio-text-secondary)] line-clamp-1 italic">
                      {p.frontmatter.description}
                    </p>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDeleteModal(p.slug, p.frontmatter.title || p.slug, p.filename);
                  }}
                  aria-label={`Delete ${p.frontmatter.title || p.slug}`}
                  title="Delete markdown file"
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-[var(--studio-text-muted)] hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-all"
                >
                  <Icon name="trash" size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-[var(--studio-border)] flex items-center justify-between text-[11px] text-[var(--studio-text-muted)]">
          <span>{posts.length} files total</span>
          <span className="font-semibold text-[var(--studio-accent)]">Local Dev Studio</span>
        </div>
      </div>
    </Drawer>
  );
}
