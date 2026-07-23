import { useEffect, useState } from 'preact/hooks';

interface UseListNavigationOptions {
  itemCount: number;
  isOpen: boolean;
  onSelect: (index: number) => void;
  onClose?: () => void;
  loop?: boolean;
}

interface UseListNavigationResult {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  onKeyDown: (e: KeyboardEvent) => void;
}

/**
 * Arrow-key up/down (with wraparound) + Enter-to-select + Escape-to-close
 * over a flat list of `itemCount` items. Shared by CommandPaletteModal (a
 * merged actions+posts list) and SlashMenu, so both get correct keyboard
 * navigation from one implementation instead of two independent, possibly
 * inconsistent copies — previously the command palette had none at all.
 */
export function useListNavigation({
  itemCount,
  isOpen,
  onSelect,
  onClose,
  loop = true,
}: UseListNavigationOptions): UseListNavigationResult {
  const [activeIndex, setActiveIndex] = useState(0);

  // Reset to the top item whenever the list opens or the filtered item
  // count changes, so a stale index from a previous search never points
  // past the end of a newly-filtered (shorter) list.
  useEffect(() => {
    setActiveIndex(0);
  }, [isOpen, itemCount]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (!isOpen || itemCount === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => {
        const next = prev + 1;
        if (next >= itemCount) return loop ? 0 : itemCount - 1;
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => {
        const next = prev - 1;
        if (next < 0) return loop ? itemCount - 1 : 0;
        return next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onSelect(activeIndex);
    } else if (e.key === 'Escape') {
      onClose?.();
    }
  };

  return { activeIndex, setActiveIndex, onKeyDown };
}
