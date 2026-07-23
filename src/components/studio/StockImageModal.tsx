import { useEffect, useId, useState } from 'preact/hooks';
import { Modal } from './ui/Modal.tsx';
import { Input } from './ui/Input.tsx';
import { Button } from './ui/Button.tsx';
import { IconButton } from './ui/IconButton.tsx';
import { SegmentedControl } from './ui/SegmentedControl.tsx';
import { Spinner } from './ui/Spinner.tsx';
import { EmptyState } from './ui/EmptyState.tsx';
import { Icon } from './ui/Icon.tsx';
import { useToast } from './ui/ToastProvider.tsx';
import type { StudioImageResult } from '../../pages/api/studio/images/search.ts';

interface StockImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
  onInsertImage: (markdownSnippet: string) => void;
}

type Provider = 'unsplash' | 'pexels';

const PROVIDER_OPTIONS: Array<{ value: Provider; label: string }> = [
  { value: 'unsplash', label: 'Unsplash' },
  { value: 'pexels', label: 'Pexels' },
];

export function StockImageModal({ isOpen, onClose, slug, onInsertImage }: StockImageModalProps) {
  const { showToast } = useToast();
  const headingId = useId();

  const [query, setQuery] = useState('nature architecture');
  const [provider, setProvider] = useState<Provider>('unsplash');
  const [results, setResults] = useState<StudioImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleSearch = async (e?: Event) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/studio/images/search?q=${encodeURIComponent(query)}&provider=${provider}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (err) {
      console.error('Failed to search images:', err);
    } finally {
      setLoading(false);
    }
  };

  // Re-search when the modal opens or the provider changes — deliberately
  // not on every `query` keystroke.
  useEffect(() => {
    if (isOpen) {
      void handleSearch();
    }
  }, [isOpen, provider]);

  const handleSelectImage = async (img: StudioImageResult) => {
    setDownloadingId(img.id);
    try {
      const res = await fetch('/api/studio/images/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: img.downloadUrl,
          slug,
          filename: `${img.id.slice(0, 16)}.jpg`,
          alt: img.alt,
          authorName: img.authorName,
          authorUrl: img.authorUrl,
          provider: img.provider,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.markdownSnippet) {
          onInsertImage(data.markdownSnippet);
          onClose();
        }
      } else {
        showToast('Failed to download image to local workspace.', 'error');
      }
    } catch (err) {
      console.error('Download image error:', err);
      showToast('Error downloading image.', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} size="xl" labelledBy={headingId}>
      <div className="p-5 border-b border-[var(--studio-border)] flex items-center justify-between bg-[var(--studio-bg-card)]">
        <div>
          <h2 id={headingId} className="text-base font-bold flex items-center gap-2 text-[var(--studio-text-primary)]">
            <Icon name="image" size={18} />
            Stock Photo Studio
          </h2>
          <p className="text-xs text-[var(--studio-text-muted)]">
            Search & download copyright-free imagery directly to your local blog image folder
          </p>
        </div>
        <IconButton icon="close" label="Close" onClick={onClose} />
      </div>

      <div className="p-4 border-b border-[var(--studio-border)] bg-[var(--studio-bg)] flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 w-full">
          <Input
            value={query}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            placeholder="Search Unsplash & Pexels (e.g. minimalist architecture, cyberpunk)..."
            containerClassName="flex-1"
          />
          <Button type="submit" variant="primary" loading={loading}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </form>

        <SegmentedControl value={provider} onChange={setProvider} options={PROVIDER_OPTIONS} className="shrink-0" />
      </div>

      <div className="flex-1 overflow-y-auto p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 studio-custom-scroll">
        {loading ? (
          <div className="col-span-full py-16 text-center flex flex-col items-center gap-3">
            <Spinner size={28} />
            <p className="text-xs text-[var(--studio-text-muted)]">Fetching stock photography...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="col-span-full">
            <EmptyState icon="image" message="No photos found. Try a different search query." />
          </div>
        ) : (
          results.map((img) => (
            <div
              key={img.id}
              onClick={() => handleSelectImage(img)}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-[var(--studio-bg)] cursor-pointer border border-[var(--studio-border)] hover:border-[var(--studio-accent)] transition-all hover:scale-[1.02] shadow-md"
            >
              <img
                src={img.previewUrl}
                alt={img.alt}
                className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                loading="lazy"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                <p className="text-xs font-semibold text-white line-clamp-1">{img.alt}</p>
                <p className="text-[11px] text-white/80">By {img.authorName}</p>
              </div>

              {downloadingId === img.id && (
                <div className="absolute inset-0 bg-[var(--studio-bg)]/90 flex items-center justify-center gap-2 text-xs font-bold text-[var(--studio-accent)]">
                  <Spinner size={14} /> Downloading...
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-[var(--studio-border)] bg-[var(--studio-bg-card)] flex justify-between items-center text-xs text-[var(--studio-text-muted)]">
        <span>
          Saving photos to <code className="text-[var(--studio-accent)] font-mono">src/content/blog/{slug}/</code>
        </span>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
