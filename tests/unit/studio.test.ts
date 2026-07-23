import { describe, it, expect } from 'vitest';
import { parseFrontmatter, stringifyFrontmatter } from '../../src/utils/frontmatter.ts';
import { sanitizeSlug } from '../../src/utils/studio-fs.ts';

describe('Atelier Frontmatter Utility', () => {
  it('should parse valid YAML frontmatter and content', () => {
    const raw = `---
title: "Testing Atelier Studio"
description: "A test description"
pubDate: 2026-07-22
category: "Technology"
tags: ["AI", "Astro"]
draft: true
---

# Hello World

This is the content body.`;

    const parsed = parseFrontmatter(raw);

    expect(parsed.frontmatter.title).toBe('Testing Atelier Studio');
    expect(parsed.frontmatter.description).toBe('A test description');
    // Regression guard: js-yaml's default schema would silently resolve this
    // unquoted date into a native Date object instead of a string.
    expect(typeof parsed.frontmatter.pubDate).toBe('string');
    expect(parsed.frontmatter.pubDate).toBe('2026-07-22');
    expect(parsed.frontmatter.category).toBe('Technology');
    expect(parsed.frontmatter.tags).toEqual(['AI', 'Astro']);
    expect(parsed.frontmatter.draft).toBe(true);
    expect(parsed.content.trim()).toBe('# Hello World\n\nThis is the content body.');
  });

  it('should stringify frontmatter into a parseable YAML markdown file', () => {
    const frontmatter = {
      title: 'Stringify Test',
      description: 'Test desc',
      pubDate: '2026-07-22',
      category: 'Essays',
      tags: ['Writing', 'Design'],
      draft: false,
    };
    const content = 'My markdown essay body.';

    const output = stringifyFrontmatter(frontmatter, content);

    expect(output.startsWith('---\n')).toBe(true);
    expect(output).toContain('My markdown essay body.');

    // Round-trip the output back through the parser rather than asserting
    // exact formatting — this is what actually matters (js-yaml's own
    // quoting/array style is an implementation detail, not a contract).
    const reparsed = parseFrontmatter(output);
    expect(reparsed.frontmatter).toEqual(frontmatter);
    expect(reparsed.content.trim()).toBe(content);
  });

  it('should round-trip titles/descriptions/tags containing YAML special characters', () => {
    // The old hand-rolled parser split tags on a bare `,` and never
    // unescaped quotes, so a comma or quote *inside* a value would corrupt
    // it. A real YAML parser handles this correctly via proper quoting.
    const frontmatter = {
      title: 'Node.js: A "Deep" Dive',
      description: 'Covers colons: and "quoted phrases" safely.',
      pubDate: '2026-07-22',
      category: 'Technology',
      tags: ['AI, ML', 'Web Dev'],
      draft: false,
    };

    const output = stringifyFrontmatter(frontmatter, 'Body text.');
    const reparsed = parseFrontmatter(output);

    expect(reparsed.frontmatter.title).toBe(frontmatter.title);
    expect(reparsed.frontmatter.description).toBe(frontmatter.description);
    expect(reparsed.frontmatter.tags).toEqual(frontmatter.tags);
  });

  it('should omit updatedDate when absent and include it when present', () => {
    const withoutUpdated = parseFrontmatter(stringifyFrontmatter({ title: 'A', tags: [] }, 'Body'));
    expect(withoutUpdated.frontmatter.updatedDate).toBeUndefined();

    const withUpdated = parseFrontmatter(
      stringifyFrontmatter({ title: 'A', tags: [], updatedDate: '2026-08-01' }, 'Body')
    );
    expect(withUpdated.frontmatter.updatedDate).toBe('2026-08-01');
  });

  it('should default draft to true for unparseable files and false for missing draft keys', () => {
    const noFrontmatter = parseFrontmatter('Just plain content, no frontmatter block.');
    expect(noFrontmatter.frontmatter.draft).toBe(true);

    const missingDraftKey = parseFrontmatter('---\ntitle: "No Draft Key"\n---\n\nBody.');
    expect(missingDraftKey.frontmatter.draft).toBe(false);
  });

  it('should sanitize titles into URL-safe slugs', () => {
    expect(sanitizeSlug('The Future of AI & Writing Studios! ')).toBe('the-future-of-ai-writing-studios');
    expect(sanitizeSlug('--- Hello World ---')).toBe('hello-world');
  });
});
