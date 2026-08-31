import { useId, useState } from 'preact/hooks';
import { Drawer } from './ui/Drawer.tsx';
import { Input } from './ui/Input.tsx';
import { Textarea } from './ui/Textarea.tsx';
import { Select } from './ui/Select.tsx';
import { Switch } from './ui/Switch.tsx';
import { Button } from './ui/Button.tsx';
import { IconButton } from './ui/IconButton.tsx';
import { Icon } from './ui/Icon.tsx';
import { sanitizeSlug } from '../../utils/slug.ts';
import type { BlogFrontmatter } from '../../utils/frontmatter.ts';

interface MetadataDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  frontmatter: BlogFrontmatter;
  onChange: (updated: BlogFrontmatter) => void;
  activeSlug: string;
  onSlugChange: (newSlug: string) => void;
}

const CATEGORY_OPTIONS = ['Notes', 'Essays', 'Technology', 'Design', 'Architecture', 'Tutorials'].map((c) => ({
  value: c,
  label: c,
}));

export function MetadataDrawer({ isOpen, onClose, frontmatter, onChange, activeSlug, onSlugChange }: MetadataDrawerProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'preview'>('settings');
  const [tagInput, setTagInput] = useState('');
  const headingId = useId();
  const slugId = useId();

  function handleFieldChange<K extends keyof BlogFrontmatter>(key: K, value: BlogFrontmatter[K]) {
    onChange({ ...frontmatter, [key]: value });
  }

  const previewSlug = sanitizeSlug(activeSlug);
  const slugNeedsCleanup = activeSlug.length > 0 && previewSlug !== activeSlug;

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !frontmatter.tags.includes(trimmed)) {
      handleFieldChange('tags', [...frontmatter.tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleFieldChange(
      'tags',
      frontmatter.tags.filter((t) => t !== tagToRemove)
    );
  };

  return (
    <Drawer open={isOpen} onClose={onClose} side="right" labelledBy={headingId}>
      <div className="flex h-full flex-col justify-between p-6 overflow-y-auto studio-custom-scroll">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--studio-border)]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--studio-accent)] animate-pulse" />
              <h2 id={headingId} className="text-base font-bold tracking-wide text-[var(--studio-text-primary)]">
                Metadata & Publishing Ceremony
              </h2>
            </div>
            <IconButton icon="close" label="Close metadata drawer" onClick={onClose} />
          </div>

          {/* Navigation Tabs */}
          <div className="flex rounded-xl bg-[var(--studio-bg)] p-1 border border-[var(--studio-border)]">
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'settings'
                  ? 'bg-[var(--studio-bg-card)] text-[var(--studio-accent)] shadow-sm'
                  : 'text-[var(--studio-text-muted)] hover:text-[var(--studio-text-primary)]'
              }`}
            >
              Metadata Settings
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'preview'
                  ? 'bg-[var(--studio-bg-card)] text-[var(--studio-accent)] shadow-sm'
                  : 'text-[var(--studio-text-muted)] hover:text-[var(--studio-text-primary)]'
              }`}
            >
              🚀 Publishing Previews
            </button>
          </div>

          {activeTab === 'settings' ? (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor={slugId}
                  className="block text-[10px] font-bold uppercase tracking-wider text-[var(--studio-text-muted)] mb-1.5"
                >
                  URL Slug / Filename (.md)
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    id={slugId}
                    value={activeSlug}
                    onInput={(e) => onSlugChange((e.target as HTMLInputElement).value)}
                    placeholder="essay-slug-name"
                    className="font-mono"
                    containerClassName="flex-1"
                  />
                  <span className="text-xs font-mono text-[var(--studio-text-muted)]">.md</span>
                </div>
                {slugNeedsCleanup && (
                  <p className="mt-1.5 text-[11px] text-[var(--studio-text-muted)]">
                    Will save as{' '}
                    <span className="font-mono text-[var(--studio-accent)]">{previewSlug || 'untitled-post'}.md</span>
                  </p>
                )}
              </div>

              <Input
                label="Post Title"
                value={frontmatter.title}
                onInput={(e) => handleFieldChange('title', (e.target as HTMLInputElement).value)}
                placeholder="e.g. The Architecture of AI Studio"
                className="font-semibold"
              />

              <Textarea
                label="Description (SEO Summary)"
                rows={3}
                value={frontmatter.description}
                onInput={(e) => handleFieldChange('description', (e.target as HTMLTextAreaElement).value)}
                placeholder="Brief summary for search engines and preview cards..."
              />

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Category"
                  value={frontmatter.category}
                  onChange={(value) => handleFieldChange('category', value)}
                  options={CATEGORY_OPTIONS}
                />
                <Input
                  type="date"
                  label="Publish Date"
                  value={frontmatter.pubDate}
                  onChange={(e) => handleFieldChange('pubDate', (e.target as HTMLInputElement).value)}
                />
              </div>

              {/* Series is optional and orthogonal to category: a post can be
                  Engineering *and* episode 3 of "What Is". Clearing the name
                  drops seriesOrder too, so the pair never goes half-set. */}
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <Input
                  label="Series (optional)"
                  value={frontmatter.series ?? ''}
                  onInput={(e) => {
                    const next = (e.target as HTMLInputElement).value;
                    onChange({
                      ...frontmatter,
                      series: next,
                      ...(next.trim() ? {} : { seriesOrder: undefined }),
                    });
                  }}
                  placeholder="e.g. What Is"
                />
                <Input
                  type="number"
                  min={1}
                  step={1}
                  label="Order"
                  value={frontmatter.seriesOrder?.toString() ?? ''}
                  disabled={!frontmatter.series?.trim()}
                  onInput={(e) => {
                    const raw = (e.target as HTMLInputElement).value.trim();
                    const parsed = Number(raw);
                    handleFieldChange(
                      'seriesOrder',
                      raw && Number.isInteger(parsed) && parsed > 0 ? parsed : undefined,
                    );
                  }}
                  placeholder="auto"
                  containerClassName="w-24"
                  className="font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--studio-text-muted)] mb-1.5">
                  Tags ({frontmatter.tags.length})
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <Input
                    value={tagInput}
                    onInput={(e) => setTagInput((e.target as HTMLInputElement).value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tag & press Enter"
                    containerClassName="flex-1"
                  />
                  <Button variant="primary" onClick={addTag}>
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {frontmatter.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 bg-[var(--studio-bg)] text-[var(--studio-accent)] text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-[var(--studio-border)]"
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        aria-label={`Remove tag ${tag}`}
                        className="hover:text-red-400 transition-colors"
                      >
                        <Icon name="close" size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--studio-border)] flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-[var(--studio-text-primary)]">Draft Status</span>
                  <span className="text-[11px] text-[var(--studio-text-muted)]">
                    {frontmatter.draft ? 'Draft (hidden in build)' : 'Published on website'}
                  </span>
                </div>
                <Switch
                  checked={!frontmatter.draft}
                  onChange={(checked) => handleFieldChange('draft', !checked)}
                  label={frontmatter.draft ? 'Mark as published' : 'Mark as draft'}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* iPhone Mobile Mockup */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--studio-text-muted)]">
                  <span>📱 Mobile iPhone View</span>
                  <span>kunalsuri.github.io</span>
                </div>
                <div className="mx-auto w-[280px] rounded-[32px] border-4 border-neutral-700 bg-neutral-900 p-4 text-left shadow-xl relative overflow-hidden">
                  <div className="mx-auto mb-3 h-4 w-20 rounded-full bg-neutral-800" />
                  <div className="rounded-2xl bg-white p-3.5 text-neutral-900 shadow">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-indigo-600">
                      {frontmatter.category || 'Essays'} • {frontmatter.pubDate || 'Today'}
                    </div>
                    <h3 className="mt-1 text-sm font-extrabold leading-tight text-neutral-900">
                      {frontmatter.title || 'Untitled Post Title'}
                    </h3>
                    <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-600 line-clamp-3">
                      {frontmatter.description || 'No summary provided yet. Add a description in metadata settings.'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {frontmatter.tags.slice(0, 3).map((t) => (
                        <span key={t} className="rounded bg-neutral-100 px-1.5 py-0.5 text-[8px] font-medium text-neutral-600">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Twitter / LinkedIn OG Card */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--studio-text-muted)]">
                  🐦 Twitter & LinkedIn Social OG Card
                </div>
                <div className="overflow-hidden rounded-xl border border-[var(--studio-border)] bg-gradient-to-br from-neutral-900 to-neutral-950 p-4 text-white shadow-md">
                  <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span>kunalsuri.github.io</span>
                  </div>
                  <h4 className="mt-2 text-sm font-bold text-white line-clamp-1">
                    {frontmatter.title || 'Untitled Post'}
                  </h4>
                  <p className="mt-1 text-[11px] text-neutral-300 line-clamp-2">
                    {frontmatter.description || 'Preview of how your blog post snippet will look when shared on social media.'}
                  </p>
                </div>
              </div>

              {/* Google Search Snippet */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--studio-text-muted)]">
                  🔍 Google Search Snippet (SERP)
                </div>
                <div className="rounded-xl border border-[var(--studio-border)] bg-[var(--studio-bg-card)] p-3.5 space-y-1">
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono truncate">
                    https://kunalsuri.github.io › blog › {previewSlug || 'essay-slug'}
                  </div>
                  <div className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer truncate">
                    {frontmatter.title || 'Untitled Post Title'} — Kunal Suri
                  </div>
                  <div className="text-xs text-[var(--studio-text-muted)] line-clamp-2">
                    {frontmatter.description || 'No description provided. Add a compelling SEO summary in metadata settings.'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-[var(--studio-border)]">
          <Button variant="secondary" onClick={onClose} className="w-full">
            Done Editing Metadata
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
