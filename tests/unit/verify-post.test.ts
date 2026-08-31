import { describe, it, expect } from 'vitest';
// Plain .mjs script — deliberately untyped, shared with the CLI gate.
import { verifyPost, stageOf, nextAction, WHAT_IS_RULES } from '../../scripts/verify-post.mjs';

/**
 * These cover the mechanical publish gate in scripts/verify-post.mjs — the
 * rules that stop a half-finished draft going live. The factual half of
 * verification is a human/agent step and is not testable here.
 */

interface Result {
  errors: string[];
  warnings: string[];
}

/** A minimal valid What Is post body, built from the required sections. */
function whatIsBody(words = 800): string {
  const filler = Array.from({ length: words }, (_, i) => `word${i}`).join(' ');
  const perSection = Math.ceil(words / WHAT_IS_RULES.requiredHeadings.length);
  return WHAT_IS_RULES.requiredHeadings
    .map((h, i) => `## ${h}\n\n${filler.split(' ').slice(i * perSection, (i + 1) * perSection).join(' ')}\n`)
    .join('\n');
}

function makePost(overrides: Record<string, unknown> = {}, body?: string) {
  const frontmatter = {
    title: 'What is an LLM?',
    description: 'A short description.',
    pubDate: '2026-08-31',
    category: 'Engineering',
    tags: ['ai'],
    series: 'What Is',
    draft: false,
    ...overrides,
  };
  return {
    slug: 'what-is-an-llm',
    file: 'what-is-an-llm/index.md',
    frontmatter,
    body: body ?? whatIsBody(),
  };
}

const run = (post: unknown, siblings: unknown[] = []): Result =>
  verifyPost(post, siblings) as Result;

describe('verifyPost — schema shape', () => {
  it('passes a well-formed What Is post', () => {
    const result = run(makePost());
    expect(result.errors).toEqual([]);
  });

  it('fails a post with no front-matter block', () => {
    const result = run({ slug: 'x', file: 'x.md', frontmatter: null, body: 'text' });
    expect(result.errors.join(' ')).toMatch(/no YAML front-matter/);
  });

  it('surfaces a YAML parse error', () => {
    const result = run({
      slug: 'x',
      file: 'x.md',
      frontmatter: null,
      body: '',
      yamlError: 'bad indentation',
    });
    expect(result.errors.join(' ')).toMatch(/not valid YAML: bad indentation/);
  });

  it.each(['title', 'description', 'pubDate'])('fails when %s is missing', (field) => {
    const result = run(makePost({ [field]: undefined }));
    expect(result.errors.join(' ')).toContain(`missing required front-matter field: ${field}`);
  });

  it('fails an unparseable pubDate', () => {
    const result = run(makePost({ pubDate: 'someday' }));
    expect(result.errors.join(' ')).toMatch(/pubDate is not a valid date/);
  });

  it('fails when tags is not an array', () => {
    expect(run(makePost({ tags: 'ai' })).errors).toContain('tags must be an array');
  });

  it('fails when draft is not a boolean', () => {
    expect(run(makePost({ draft: 'yes' })).errors).toContain('draft must be a boolean');
  });

  it('fails an over-long description', () => {
    const result = run(makePost({ description: 'x'.repeat(161) }));
    expect(result.errors.join(' ')).toMatch(/description is 161 chars/);
  });

  it('accepts a description exactly at the limit', () => {
    expect(run(makePost({ description: 'x'.repeat(160) })).errors).toEqual([]);
  });
});

describe('verifyPost — series integrity', () => {
  it('fails seriesOrder without a series', () => {
    const result = run(makePost({ series: undefined, seriesOrder: 2 }));
    expect(result.errors.join(' ')).toMatch(/seriesOrder is set but series is not/);
  });

  it.each([0, -1, 1.5])('fails a non-positive-integer seriesOrder (%s)', (value) => {
    const result = run(makePost({ seriesOrder: value }));
    expect(result.errors.join(' ')).toMatch(/seriesOrder must be a positive integer/);
  });

  it('fails a duplicate seriesOrder within the same series', () => {
    const sibling = makePost({ seriesOrder: 2 });
    sibling.slug = 'what-is-a-token';
    const result = run(makePost({ seriesOrder: 2 }), [sibling]);
    expect(result.errors.join(' ')).toMatch(/already used by "what-is-a-token"/);
  });

  it('allows the same seriesOrder in a different series', () => {
    const sibling = makePost({ seriesOrder: 2, series: 'Field Notes' });
    sibling.slug = 'other';
    expect(run(makePost({ seriesOrder: 2 }), [sibling]).errors).toEqual([]);
  });

  it('warns when series and category are the same value', () => {
    const result = run(makePost({ category: 'What Is' }));
    expect(result.warnings.join(' ')).toMatch(/orthogonal/);
  });
});

describe('verifyPost — body hygiene', () => {
  it.each(['TODO', 'TKTK', 'FIXME', 'XXX'])('fails on a leftover %s marker', (marker) => {
    const result = run(makePost({}, `${whatIsBody()}\n\n${marker} finish this`));
    expect(result.errors.join(' ')).toMatch(/unresolved placeholder marker/);
  });

  it('fails on an unresolved [?] uncertainty marker', () => {
    const result = run(makePost({}, `${whatIsBody()}\n\nContext is 200k tokens [?]`));
    expect(result.errors.join(' ')).toMatch(/unresolved placeholder marker/);
  });

  it('fails on a placeholder example.com link', () => {
    const result = run(makePost({}, `${whatIsBody()}\n\n[source](https://example.com/page)`));
    expect(result.errors.join(' ')).toMatch(/placeholder link/);
  });

  it('fails on an empty anchor link', () => {
    const result = run(makePost({}, `${whatIsBody()}\n\n[source](#)`));
    expect(result.errors.join(' ')).toMatch(/placeholder link/);
  });

  it('allows a real external link', () => {
    const result = run(makePost({}, `${whatIsBody()}\n\n[spec](https://arxiv.org/abs/1706.03762)`));
    expect(result.errors).toEqual([]);
  });
});

describe('verifyPost — What Is house style', () => {
  it('fails a title that is not a question', () => {
    const result = run(makePost({ title: 'Large Language Models Explained' }));
    expect(result.errors.join(' ')).toMatch(/title must read "What is <thing>\?"/);
  });

  it('fails a slug that does not start with what-is-', () => {
    const post = makePost();
    post.slug = 'llms-explained';
    expect(run(post).errors.join(' ')).toMatch(/slug must start with "what-is-"/);
  });

  it.each(WHAT_IS_RULES.requiredHeadings)('fails when the "%s" section is missing', (heading) => {
    const body = whatIsBody().replace(`## ${heading}`, '## Something else');
    const result = run(makePost({}, body));
    expect(result.errors.join(' ')).toContain(`missing required section: "## ${heading}"`);
  });

  it('matches required headings case-insensitively', () => {
    const body = whatIsBody().replace('## The short answer', '## THE SHORT ANSWER');
    expect(run(makePost({}, body)).errors).toEqual([]);
  });

  it('accepts a short post — brevity is the goal, not a failure', () => {
    const result = run(makePost({}, whatIsBody(120)));
    expect(result.errors).toEqual([]);
  });

  it('warns — but does not fail — above the word ceiling', () => {
    const result = run(makePost({}, whatIsBody(1500)));
    expect(result.errors).toEqual([]);
    expect(result.warnings.join(' ')).toMatch(/over the 1200-word ceiling/);
  });

  it('excludes fenced code blocks from the word count', () => {
    // 1400 prose words would trip the ceiling; wrapped in a fence it must not.
    const code = '```js\n' + Array.from({ length: 1400 }, (_, i) => `word${i}`).join(' ') + '\n```';
    const result = run(makePost({}, `${whatIsBody(300)}\n\n${code}`));
    expect(result.warnings.join(' ')).not.toMatch(/word ceiling/);
  });

  it('does not apply What Is structural rules to other series', () => {
    const post = makePost({ series: 'Field Notes', title: 'A short note' }, 'Just a few words.');
    post.slug = 'a-short-note';
    expect(run(post).errors).toEqual([]);
  });

  it('does not apply What Is structural rules to a standalone post', () => {
    const post = makePost({ series: undefined, title: 'A standalone essay' }, 'Short.');
    post.slug = 'a-standalone-essay';
    expect(run(post).errors).toEqual([]);
  });
});

describe('stageOf — the disk is the only source of truth', () => {
  it('reports published for a post with draft:false', () => {
    expect(stageOf(makePost({ draft: false }))).toBe('published');
  });

  it('reports draft for draft:true with no review report', () => {
    const post = makePost({ draft: true });
    post.slug = 'what-is-something-never-reviewed';
    expect(stageOf(post)).toBe('draft');
  });

  it('reports idea for a post that does not exist', () => {
    expect(stageOf(undefined)).toBe('idea');
  });

  it('gives a next action for every stage', () => {
    for (const stage of ['idea', 'draft', 'verified', 'published']) {
      expect(nextAction(stage, 'what-is-x')).toBeTruthy();
    }
  });
});

describe('verifyPost — draft state', () => {
  it('warns that a draft will not appear in production', () => {
    const result = run(makePost({ draft: true }));
    expect(result.errors).toEqual([]);
    expect(result.warnings.join(' ')).toMatch(/still marked draft: true/);
  });

  it('does not warn for a published post', () => {
    expect(run(makePost({ draft: false })).warnings).toEqual([]);
  });
});
