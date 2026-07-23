import { describe, it, expect } from 'vitest';
import { slugify } from '../../src/utils/taxonomy';

describe('slugify', () => {
  it('converts a simple phrase to lowercase hyphenated slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('replaces special characters with hyphens', () => {
    expect(slugify('Astro & Web')).toBe('astro-web');
  });

  it('trims leading and trailing whitespace', () => {
    expect(slugify('  hello world  ')).toBe('hello-world');
  });

  it('strips leading and trailing hyphens', () => {
    expect(slugify('-hello-world-')).toBe('hello-world');
  });

  it('collapses multiple consecutive non-word characters into a single hyphen', () => {
    expect(slugify('hello---world')).toBe('hello-world');
    expect(slugify('hello   world')).toBe('hello-world');
    expect(slugify('hello & / world')).toBe('hello-world');
  });

  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(slugify('   ')).toBe('');
  });

  it('leaves already slugified input unchanged', () => {
    expect(slugify('hello-world')).toBe('hello-world');
  });

  it('converts a single word to lowercase', () => {
    expect(slugify('TypeScript')).toBe('typescript');
  });

  it('handles mixed case', () => {
    expect(slugify('My Great POST')).toBe('my-great-post');
  });

  it('handles numbers', () => {
    expect(slugify('Web 3.0 Is Here')).toBe('web-3-0-is-here');
  });

  it('handles underscores (kept as word characters)', () => {
    // Underscores are \w characters, so they survive the regex
    expect(slugify('hello_world')).toBe('hello_world');
  });

  it('handles parentheses and brackets', () => {
    expect(slugify('React (old) vs Preact')).toBe('react-old-vs-preact');
  });

  it('handles apostrophes and quotation marks', () => {
    expect(slugify("it's a test")).toBe('it-s-a-test');
  });

  it('produces consistent output for taxonomy use cases', () => {
    // These are the real-world inputs from the blog:
    expect(slugify('Notes')).toBe('notes');
    expect(slugify('Engineering')).toBe('engineering');
    expect(slugify('meta')).toBe('meta');
    expect(slugify('astro')).toBe('astro');
    expect(slugify('web')).toBe('web');
  });
});
