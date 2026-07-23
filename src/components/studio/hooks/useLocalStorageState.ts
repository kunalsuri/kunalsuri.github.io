import { useState } from 'preact/hooks';

/**
 * useState backed by localStorage — read once on mount, written on every
 * change. `isValid` lets a caller reject a stored value that no longer
 * matches the expected shape (e.g. a theme name from a removed theme) and
 * fall back to the default rather than trusting it blindly.
 */
export function useLocalStorageState<T>(key: string, defaultValue: T, isValid?: (value: unknown) => value is T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const stored = window.localStorage.getItem(key);
      if (stored === null) return defaultValue;
      const parsed: unknown = JSON.parse(stored);
      if (isValid && !isValid(parsed)) return defaultValue;
      return parsed as T;
    } catch {
      return defaultValue;
    }
  });

  const setAndPersist = (next: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const resolved = typeof next === 'function' ? (next as (prev: T) => T)(prev) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // localStorage can be unavailable (private browsing, quota) — state
        // still updates in memory, it just won't persist across reloads.
      }
      return resolved;
    });
  };

  return [value, setAndPersist] as const;
}
