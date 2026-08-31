import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * The series helpers read from the blog collection, so the collection is
 * mocked with fixtures rather than the repo's real posts — otherwise these
 * tests would break every time a post is written.
 */
const posts: Array<Record<string, unknown>> = [];

vi.mock('astro:content', () => ({
  getCollection: async (_name: string, filter?: (entry: unknown) => boolean) =>
    filter ? posts.filter((p) => filter(p)) : posts,
  defineCollection: () => {},
  reference: () => {},
  glob: () => {},
}));

function post(
  id: string,
  data: {
    title?: string;
    pubDate: string;
    series?: string;
    seriesOrder?: number;
    draft?: boolean;
  },
) {
  return {
    id,
    body: 'body text',
    data: {
      title: data.title ?? id,
      description: `${id} description`,
      pubDate: new Date(data.pubDate),
      category: 'Engineering',
      tags: [],
      draft: data.draft ?? false,
      ...(data.series ? { series: data.series } : {}),
      ...(data.seriesOrder !== undefined ? { seriesOrder: data.seriesOrder } : {}),
    },
  };
}

function setPosts(...entries: ReturnType<typeof post>[]) {
  posts.length = 0;
  posts.push(...entries);
}

const { getAllSeries, getPostsBySeries, getSeriesContext } = await import('../../src/utils/series');

beforeEach(() => {
  posts.length = 0;
});

describe('getAllSeries', () => {
  it('returns nothing when no post declares a series', async () => {
    setPosts(post('a', { pubDate: '2026-01-01' }), post('b', { pubDate: '2026-02-01' }));
    expect(await getAllSeries()).toEqual([]);
  });

  it('groups posts by series and counts them', async () => {
    setPosts(
      post('a', { pubDate: '2026-01-01', series: 'What Is' }),
      post('b', { pubDate: '2026-02-01', series: 'What Is' }),
      post('c', { pubDate: '2026-03-01' }),
    );
    const series = await getAllSeries();
    expect(series).toHaveLength(1);
    expect(series[0].name).toBe('What Is');
    expect(series[0].slug).toBe('what-is');
    expect(series[0].count).toBe(2);
  });

  it('tracks the most recent pubDate in the series', async () => {
    setPosts(
      post('a', { pubDate: '2026-01-01', series: 'What Is' }),
      post('b', { pubDate: '2026-05-20', series: 'What Is' }),
    );
    const [series] = await getAllSeries();
    expect(series.latest.toISOString().slice(0, 10)).toBe('2026-05-20');
  });

  it('sorts series by most recently updated first', async () => {
    setPosts(
      post('a', { pubDate: '2026-01-01', series: 'Old Thread' }),
      post('b', { pubDate: '2026-09-01', series: 'What Is' }),
    );
    expect((await getAllSeries()).map((s) => s.name)).toEqual(['What Is', 'Old Thread']);
  });

  it('attaches the editorial description from SERIES_META when one exists', async () => {
    setPosts(post('a', { pubDate: '2026-01-01', series: 'What Is' }));
    const [series] = await getAllSeries();
    expect(series.description).toBeTruthy();
  });

  it('leaves description undefined for a series with no SERIES_META entry', async () => {
    setPosts(post('a', { pubDate: '2026-01-01', series: 'Unlisted Thread' }));
    const [series] = await getAllSeries();
    expect(series.description).toBeUndefined();
  });
});

describe('getPostsBySeries', () => {
  it('returns series posts oldest-first — a series has a reading order', async () => {
    setPosts(
      post('third', { pubDate: '2026-03-01', series: 'What Is' }),
      post('first', { pubDate: '2026-01-01', series: 'What Is' }),
      post('second', { pubDate: '2026-02-01', series: 'What Is' }),
    );
    expect((await getPostsBySeries('what-is')).map((p) => p.id)).toEqual([
      'first',
      'second',
      'third',
    ]);
  });

  it('honours explicit seriesOrder over pubDate', async () => {
    setPosts(
      post('written-first', { pubDate: '2026-01-01', series: 'What Is', seriesOrder: 2 }),
      post('written-later', { pubDate: '2026-06-01', series: 'What Is', seriesOrder: 1 }),
    );
    expect((await getPostsBySeries('what-is')).map((p) => p.id)).toEqual([
      'written-later',
      'written-first',
    ]);
  });

  it('sorts numbered posts ahead of unnumbered ones', async () => {
    setPosts(
      post('unnumbered', { pubDate: '2026-01-01', series: 'What Is' }),
      post('numbered', { pubDate: '2026-09-01', series: 'What Is', seriesOrder: 1 }),
    );
    expect((await getPostsBySeries('what-is')).map((p) => p.id)).toEqual([
      'numbered',
      'unnumbered',
    ]);
  });

  it('excludes posts from other series', async () => {
    setPosts(
      post('a', { pubDate: '2026-01-01', series: 'What Is' }),
      post('b', { pubDate: '2026-02-01', series: 'Field Notes' }),
    );
    expect((await getPostsBySeries('what-is')).map((p) => p.id)).toEqual(['a']);
  });

  it('matches on the slugified series name', async () => {
    setPosts(post('a', { pubDate: '2026-01-01', series: 'Notes & Queries' }));
    expect(await getPostsBySeries('notes-queries')).toHaveLength(1);
  });

  it('returns an empty array for an unknown series slug', async () => {
    setPosts(post('a', { pubDate: '2026-01-01', series: 'What Is' }));
    expect(await getPostsBySeries('nope')).toEqual([]);
  });
});

describe('getSeriesContext', () => {
  it('is undefined for a post with no series', async () => {
    setPosts(post('solo', { pubDate: '2026-01-01' }));
    expect(await getSeriesContext('solo')).toBeUndefined();
  });

  it('is undefined for a series of one — "Part 1 of 1" is noise, not navigation', async () => {
    setPosts(post('only', { pubDate: '2026-01-01', series: 'What Is' }));
    expect(await getSeriesContext('only')).toBeUndefined();
  });

  it('is undefined for an unknown post id', async () => {
    setPosts(post('a', { pubDate: '2026-01-01', series: 'What Is' }));
    expect(await getSeriesContext('missing')).toBeUndefined();
  });

  it('reports a 1-based position and total in reading order', async () => {
    setPosts(
      post('a', { pubDate: '2026-01-01', series: 'What Is' }),
      post('b', { pubDate: '2026-02-01', series: 'What Is' }),
      post('c', { pubDate: '2026-03-01', series: 'What Is' }),
    );
    const context = await getSeriesContext('b');
    expect(context?.position).toBe(2);
    expect(context?.total).toBe(3);
  });

  it('exposes prev and next siblings', async () => {
    setPosts(
      post('a', { pubDate: '2026-01-01', series: 'What Is' }),
      post('b', { pubDate: '2026-02-01', series: 'What Is' }),
      post('c', { pubDate: '2026-03-01', series: 'What Is' }),
    );
    const context = await getSeriesContext('b');
    expect(context?.prev?.id).toBe('a');
    expect(context?.next?.id).toBe('c');
  });

  it('omits prev on the first post and next on the last', async () => {
    setPosts(
      post('a', { pubDate: '2026-01-01', series: 'What Is' }),
      post('b', { pubDate: '2026-02-01', series: 'What Is' }),
    );
    const first = await getSeriesContext('a');
    const last = await getSeriesContext('b');
    expect(first?.prev).toBeUndefined();
    expect(first?.next?.id).toBe('b');
    expect(last?.prev?.id).toBe('a');
    expect(last?.next).toBeUndefined();
  });

  it('lists every entry and marks exactly one as current', async () => {
    setPosts(
      post('a', { pubDate: '2026-01-01', series: 'What Is' }),
      post('b', { pubDate: '2026-02-01', series: 'What Is' }),
      post('c', { pubDate: '2026-03-01', series: 'What Is' }),
    );
    const context = await getSeriesContext('c');
    expect(context?.entries.map((e) => e.id)).toEqual(['a', 'b', 'c']);
    expect(context?.entries.filter((e) => e.isCurrent).map((e) => e.id)).toEqual(['c']);
  });
});
