import { useRef } from 'preact/hooks';

/**
 * A ref that always holds the latest value passed in, updated during every
 * render (not in an effect, so there's no one-render-behind lag). Lets a
 * callback registered once — e.g. a `window.addEventListener` in an effect
 * with an empty dependency array — read current state without needing that
 * state in its own dependency array, which for an event listener would
 * mean tearing the listener down and re-adding it on every change.
 */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
