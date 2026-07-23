/**
 * One inline-SVG icon set for all of Studio, in the same restrained
 * stroke-icon language as the main site's ThemeToggle.astro (24x24,
 * 2px round stroke) — replaces every emoji used previously.
 */
export type IconName =
  | 'folder'
  | 'search'
  | 'settings'
  | 'save'
  | 'image'
  | 'sparkles'
  | 'trash'
  | 'sun'
  | 'moon'
  | 'moon-stars'
  | 'scroll'
  | 'expand'
  | 'help-circle'
  | 'close'
  | 'quote'
  | 'code'
  | 'lightbulb'
  | 'chevron-down'
  | 'plus'
  | 'check'
  | 'external-link'
  | 'keyboard'
  | 'bold'
  | 'italic'
  | 'link'
  | 'strikethrough'
  | 'bookmark'
  | 'columns'
  | 'eye';

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 16, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={name === 'sparkles' ? 'currentColor' : 'none'}
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {renderPath(name)}
    </svg>
  );
}

// A switch that returns fresh JSX per call (rather than a Record<IconName,
// JSXElement> built once at module scope) — Preact vnodes carry internal
// bookkeeping fields (_dom/_component/_children) that get mutated in place
// during rendering, so reusing one vnode *instance* at more than one place
// in the tree at once (e.g. the same "close" icon in two open modals) is
// unsafe. A switch means every <Icon /> call creates its own vnodes.
function renderPath(name: IconName) {
  switch (name) {
    case 'folder':
      return <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />;
    case 'search':
      return (
        <>
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.5" y2="16.5" />
        </>
      );
    case 'settings':
      return (
        <>
          <line x1="4" y1="6" x2="20" y2="6" />
          <circle cx="14" cy="6" r="2" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <circle cx="9" cy="12" r="2" />
          <line x1="4" y1="18" x2="20" y2="18" />
          <circle cx="16" cy="18" r="2" />
        </>
      );
    case 'save':
      return (
        <>
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M4 19h16" />
        </>
      );
    case 'image':
      return (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8.5" cy="9.5" r="1.5" />
          <path d="m3 16 5-5 4 4 4-4 5 5" />
        </>
      );
    case 'sparkles':
      return <path d="M12 3 14 10 21 12 14 14 12 21 10 14 3 12 10 10Z" />;
    case 'trash':
      return (
        <>
          <path d="M4 7h16" />
          <path d="M10 11v6M14 11v6" />
          <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
          <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
        </>
      );
    case 'sun':
      return (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </>
      );
    case 'moon':
      return <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />;
    case 'moon-stars':
      return (
        <>
          <path d="M20 13.2A8 8 0 1 1 11.3 4a6.2 6.2 0 0 0 8.7 9.2z" />
          <path d="M19 3v3M17.5 4.5h3" />
        </>
      );
    case 'scroll':
      return (
        <>
          <path d="M6 3h9a3 3 0 0 1 3 3v15H8a2 2 0 0 1-2-2V3Z" />
          <path d="M6 3a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2" />
          <line x1="10" y1="8" x2="14" y2="8" />
          <line x1="10" y1="12" x2="14" y2="12" />
        </>
      );
    case 'expand':
      return <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />;
    case 'help-circle':
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7" />
          <line x1="12" y1="17" x2="12" y2="17.01" />
        </>
      );
    case 'close':
      return (
        <>
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </>
      );
    case 'quote':
      return (
        <>
          <path d="M7 8c-2 1-3 3-3 5s1.5 3 3 3 2.5-1 2.5-2.5S8.5 11 7 11c0-1 1-2 2-2.5" />
          <path d="M16 8c-2 1-3 3-3 5s1.5 3 3 3 2.5-1 2.5-2.5S17.5 11 16 11c0-1 1-2 2-2.5" />
        </>
      );
    case 'code':
      return (
        <>
          <polyline points="8 6 3 12 8 18" />
          <polyline points="16 6 21 12 16 18" />
        </>
      );
    case 'lightbulb':
      return (
        <>
          <path d="M9 18h6M10 22h4" />
          <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2Z" />
        </>
      );
    case 'chevron-down':
      return <polyline points="6 9 12 15 18 9" />;
    case 'plus':
      return (
        <>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </>
      );
    case 'check':
      return <polyline points="20 6 9 17 4 12" />;
    case 'external-link':
      return (
        <>
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </>
      );
    case 'keyboard':
      return (
        <>
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <line x1="6" y1="10" x2="6" y2="10" />
          <line x1="10" y1="10" x2="10" y2="10" />
          <line x1="14" y1="10" x2="14" y2="10" />
          <line x1="18" y1="10" x2="18" y2="10" />
          <line x1="7" y1="15" x2="17" y2="15" />
        </>
      );
    case 'bold':
      return (
        <>
          <path d="M7 4h6a3.5 3.5 0 0 1 0 7H7z" />
          <path d="M7 11h7a3.5 3.5 0 0 1 0 7H7z" />
        </>
      );
    case 'italic':
      return (
        <>
          <line x1="14" y1="4" x2="10" y2="4" />
          <line x1="9" y1="20" x2="5" y2="20" />
          <line x1="14.5" y1="4" x2="9.5" y2="20" />
        </>
      );
    case 'link':
      return (
        <>
          <path d="M9 15L15 9" />
          <path d="M11 6l1-1a4 4 0 0 1 6 6l-1 1" />
          <path d="M13 18l-1 1a4 4 0 0 1-6-6l1-1" />
        </>
      );
    case 'columns':
      return (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </>
      );
    case 'eye':
      return (
        <>
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      );
    case 'strikethrough':
      return (
        <>
          <path d="M16 4H9a3 3 0 0 0-2.83 4M14 12a4 4 0 0 1 0 8H6" />
          <line x1="4" y1="12" x2="20" y2="12" />
        </>
      );
    case 'bookmark':
      return (
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
      );
    default:
      return null;
  }
}
