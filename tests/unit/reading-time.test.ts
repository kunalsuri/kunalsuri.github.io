import { describe, it, expect } from 'vitest';
import { readingTime } from '../../src/utils/reading-time';

describe('readingTime', () => {
  it('returns "1 min read" for an empty string', () => {
    expect(readingTime('')).toBe('1 min read');
  });

  it('returns "1 min read" for a single word', () => {
    expect(readingTime('hello')).toBe('1 min read');
  });

  it('returns "1 min read" for exactly 220 words (one minute at 220 wpm)', () => {
    const text = Array(220).fill('word').join(' ');
    expect(readingTime(text)).toBe('1 min read');
  });

  it('returns "1 min read" for 221 words (rounds down to 1)', () => {
    const text = Array(221).fill('word').join(' ');
    expect(readingTime(text)).toBe('1 min read');
  });

  it('returns "2 min read" for 330 words (330/220 ≈ 1.5 → rounds to 2)', () => {
    const text = Array(330).fill('word').join(' ');
    expect(readingTime(text)).toBe('2 min read');
  });

  it('returns "2 min read" for 440 words (exact 2-minute boundary)', () => {
    const text = Array(440).fill('word').join(' ');
    expect(readingTime(text)).toBe('2 min read');
  });

  it('returns "10 min read" for 2200 words', () => {
    const text = Array(2200).fill('word').join(' ');
    expect(readingTime(text)).toBe('10 min read');
  });

  it('handles whitespace-heavy strings correctly (tabs, newlines)', () => {
    // 5 actual words spread across whitespace-heavy text
    const text = '  hello\t\tworld\n\nfoo   bar\nbaz  ';
    expect(readingTime(text)).toBe('1 min read');
  });

  it('counts markdown syntax elements as words', () => {
    // Markdown headings, bold, links — each non-whitespace token counts
    const text = '## Heading\n\n**bold text** and [a link](http://example.com)\n\n```js\nconsole.log("hi")\n```';
    const result = readingTime(text);
    // Should be "1 min read" since there are fewer than 220 words
    expect(result).toBe('1 min read');
  });

  it('never returns "0 min read" for any non-empty input', () => {
    expect(readingTime('a')).toBe('1 min read');
    expect(readingTime('a b c')).toBe('1 min read');
  });

  it('handles a very long document', () => {
    // 4400 words → 20 min read
    const text = Array(4400).fill('word').join(' ');
    expect(readingTime(text)).toBe('20 min read');
  });
});
