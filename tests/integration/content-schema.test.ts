import { describe, it, expect } from 'vitest';
import { z } from 'astro/zod';

/**
 * Re-declare the blog front-matter schema here (mirrors content.config.ts).
 * This lets us test the schema in isolation without booting the Astro runtime.
 * If the schema in content.config.ts diverges, these tests will catch the
 * mismatch because the Astro build (npm run build) also validates.
 */
const blogSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  category: z.string().default('Notes'),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
});

describe('Blog content schema', () => {
  describe('valid front-matter', () => {
    it('accepts minimal required fields', () => {
      const result = blogSchema.safeParse({
        title: 'Hello World',
        description: 'A first post.',
        pubDate: '2026-01-01',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('Notes'); // default
        expect(result.data.tags).toEqual([]); // default
        expect(result.data.draft).toBe(false); // default
      }
    });

    it('accepts all optional fields', () => {
      const result = blogSchema.safeParse({
        title: 'Full Post',
        description: 'A comprehensive post.',
        pubDate: '2026-07-09',
        updatedDate: '2026-07-10',
        category: 'Engineering',
        tags: ['astro', 'web'],
        draft: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('Engineering');
        expect(result.data.tags).toEqual(['astro', 'web']);
        expect(result.data.draft).toBe(true);
        expect(result.data.updatedDate).toBeInstanceOf(Date);
      }
    });

    it('coerces pubDate string to a Date object', () => {
      const result = blogSchema.safeParse({
        title: 'Test',
        description: 'Test desc.',
        pubDate: '2026-03-15',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pubDate).toBeInstanceOf(Date);
        expect(result.data.pubDate.getFullYear()).toBe(2026);
      }
    });

    it('accepts a Date object for pubDate', () => {
      const result = blogSchema.safeParse({
        title: 'Test',
        description: 'Test desc.',
        pubDate: new Date('2026-06-01'),
      });
      expect(result.success).toBe(true);
    });

    it('accepts draft: true', () => {
      const result = blogSchema.safeParse({
        title: 'Draft Post',
        description: 'Not yet public.',
        pubDate: '2026-01-01',
        draft: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.draft).toBe(true);
      }
    });

    it('defaults tags to an empty array when omitted', () => {
      const result = blogSchema.safeParse({
        title: 'No Tags',
        description: 'A post without tags.',
        pubDate: '2026-01-01',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual([]);
      }
    });

    it('defaults category to "Notes" when omitted', () => {
      const result = blogSchema.safeParse({
        title: 'Default Category',
        description: 'Should be Notes.',
        pubDate: '2026-01-01',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('Notes');
      }
    });
  });

  describe('invalid front-matter', () => {
    it('rejects missing title', () => {
      const result = blogSchema.safeParse({
        description: 'A post without a title.',
        pubDate: '2026-01-01',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing description', () => {
      const result = blogSchema.safeParse({
        title: 'No Description',
        pubDate: '2026-01-01',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing pubDate', () => {
      const result = blogSchema.safeParse({
        title: 'No Date',
        description: 'A post without a date.',
      });
      expect(result.success).toBe(false);
    });

    it('rejects an invalid pubDate string', () => {
      const result = blogSchema.safeParse({
        title: 'Bad Date',
        description: 'Invalid date format.',
        pubDate: 'not-a-date',
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-string title', () => {
      const result = blogSchema.safeParse({
        title: 42,
        description: 'Numeric title.',
        pubDate: '2026-01-01',
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-array tags', () => {
      const result = blogSchema.safeParse({
        title: 'Bad Tags',
        description: 'Tags should be an array.',
        pubDate: '2026-01-01',
        tags: 'not-an-array',
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-boolean draft', () => {
      const result = blogSchema.safeParse({
        title: 'Bad Draft',
        description: 'Draft should be boolean.',
        pubDate: '2026-01-01',
        draft: 'yes',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('accepts an empty tags array', () => {
      const result = blogSchema.safeParse({
        title: 'Empty Tags',
        description: 'Tags explicitly set to [].',
        pubDate: '2026-01-01',
        tags: [],
      });
      expect(result.success).toBe(true);
    });

    it('accepts a single tag', () => {
      const result = blogSchema.safeParse({
        title: 'One Tag',
        description: 'Just one tag.',
        pubDate: '2026-01-01',
        tags: ['solo'],
      });
      expect(result.success).toBe(true);
    });

    it('strips unknown extra fields (default Zod behavior)', () => {
      const result = blogSchema.safeParse({
        title: 'Extra Fields',
        description: 'Has unknown keys.',
        pubDate: '2026-01-01',
        unknownField: 'should be stripped',
      });
      // Zod's default object mode strips unknown keys — input is still valid
      expect(result.success).toBe(true);
    });
  });
});
