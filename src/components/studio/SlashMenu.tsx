import { Icon, type IconName } from './ui/Icon.tsx';

export type SlashCommandId = 'image' | 'h2' | 'h3' | 'quote' | 'code' | 'callout' | 'divider' | 'bookmark';

export interface SlashCommand {
  id: SlashCommandId;
  label: string;
  icon?: IconName;
  glyph?: string;
  keywords: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: 'image',
    label: 'Stock Photo Finder (Unsplash/Pexels)',
    icon: 'image',
    keywords: 'image photo picture unsplash pexels stock',
  },
  {
    id: 'bookmark',
    label: 'Visual Bookmark Card (Link Unfurl)',
    icon: 'bookmark',
    keywords: 'bookmark card link unfurl url preview',
  },
  { id: 'h2', label: 'Section Heading 2', glyph: 'H2', keywords: 'h2 heading section' },
  { id: 'h3', label: 'Sub-heading 3', glyph: 'H3', keywords: 'h3 heading subheading sub' },
  { id: 'quote', label: 'Pull Quote Block', icon: 'quote', keywords: 'quote blockquote pull' },
  { id: 'code', label: 'Syntax Code Block', icon: 'code', keywords: 'code block syntax' },
  { id: 'callout', label: 'Highlight Callout Note', icon: 'lightbulb', keywords: 'callout note highlight tip' },
  { id: 'divider', label: 'Horizontal Divider', glyph: '—', keywords: 'divider hr line separator' },
];

interface SlashMenuProps {
  isOpen: boolean;
  filter: string;
  commands: SlashCommand[];
  activeIndex: number;
  onHover: (index: number) => void;
  onSelect: (index: number) => void;
}

/**
 * Extracted from EditorCanvas.tsx. Purely presentational — keyboard
 * handling (typing to filter, arrow keys, Enter, Escape/Backspace) lives in
 * EditorCanvas's textarea keydown handler via useListNavigation, since
 * focus never leaves the textarea while this is open (Notion-style: the
 * `/` trigger itself is never actually typed into the document).
 */
export function SlashMenu({ isOpen, filter, commands, activeIndex, onHover, onSelect }: SlashMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute left-0 bottom-24 z-40 bg-[var(--studio-bg-secondary)] border border-[var(--studio-border)] rounded-2xl shadow-2xl p-2 w-72 backdrop-blur-xl animate-studio-fade text-[var(--studio-text-primary)]">
      <div className="text-[10px] font-bold text-[var(--studio-text-muted)] px-3 py-1.5 uppercase tracking-wider border-b border-[var(--studio-border)] mb-1 flex items-center justify-between">
        <span>Insert Block Element</span>
        {filter && <span className="font-mono normal-case text-[var(--studio-accent)]">/{filter}</span>}
      </div>
      <div className="space-y-0.5 text-xs max-h-64 overflow-y-auto studio-custom-scroll">
        {commands.length === 0 ? (
          <div className="px-3 py-4 text-center text-[var(--studio-text-muted)]">No matching blocks</div>
        ) : (
          commands.map((cmd, i) => (
            <button
              key={cmd.id}
              type="button"
              onMouseEnter={() => onHover(i)}
              onClick={() => onSelect(i)}
              className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 transition-colors ${
                i === activeIndex
                  ? 'bg-[var(--studio-accent-glow)] text-[var(--studio-accent)]'
                  : 'text-[var(--studio-text-primary)] hover:bg-[var(--studio-accent-glow)] hover:text-[var(--studio-accent)]'
              }`}
            >
              {cmd.icon ? (
                <Icon name={cmd.icon} size={14} />
              ) : (
                <span className="font-bold w-3.5 shrink-0 text-center text-[10px]">{cmd.glyph}</span>
              )}
              <span>{cmd.label}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
