import { describe, it, expect } from 'vitest';
import {
  SITE_TITLE,
  SITE_DESCRIPTION,
  SITE_URL,
  AUTHOR,
  SITE_TAGLINE,
  SOCIAL,
  NAV_LINKS,
  GISCUS,
  isCommentsConfigured,
} from '../../src/consts';

describe('Site constants', () => {
  describe('SITE_TITLE', () => {
    it('is a non-empty string', () => {
      expect(SITE_TITLE).toBeTruthy();
      expect(typeof SITE_TITLE).toBe('string');
    });
  });

  describe('SITE_DESCRIPTION', () => {
    it('is a non-empty string', () => {
      expect(SITE_DESCRIPTION).toBeTruthy();
      expect(typeof SITE_DESCRIPTION).toBe('string');
    });

    it('is suitable for a meta description (under 200 chars)', () => {
      expect(SITE_DESCRIPTION.length).toBeLessThanOrEqual(200);
    });
  });

  describe('SITE_URL', () => {
    it('is a valid HTTPS URL', () => {
      expect(SITE_URL).toMatch(/^https:\/\//);
    });

    it('parses as a valid URL', () => {
      expect(() => new URL(SITE_URL)).not.toThrow();
    });

    it('does not have a trailing slash', () => {
      expect(SITE_URL).not.toMatch(/\/$/);
    });
  });

  describe('AUTHOR', () => {
    it('is a non-empty string', () => {
      expect(AUTHOR).toBeTruthy();
      expect(typeof AUTHOR).toBe('string');
    });
  });

  describe('SITE_TAGLINE', () => {
    it('is a non-empty string', () => {
      expect(SITE_TAGLINE).toBeTruthy();
      expect(typeof SITE_TAGLINE).toBe('string');
    });
  });
});

describe('SOCIAL', () => {
  it('has a github property with a valid GitHub URL', () => {
    expect(SOCIAL.github).toBeTruthy();
    expect(SOCIAL.github).toMatch(/^https:\/\/github\.com\//);
  });
});

describe('NAV_LINKS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(NAV_LINKS)).toBe(true);
    expect(NAV_LINKS.length).toBeGreaterThan(0);
  });

  it('every link has a non-empty href and label', () => {
    for (const link of NAV_LINKS) {
      expect(link.href).toBeTruthy();
      expect(typeof link.href).toBe('string');
      expect(link.label).toBeTruthy();
      expect(typeof link.label).toBe('string');
    }
  });

  it('every href starts with /', () => {
    for (const link of NAV_LINKS) {
      expect(link.href).toMatch(/^\//);
    }
  });

  it('has no duplicate hrefs', () => {
    const hrefs = NAV_LINKS.map((l) => l.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('has no duplicate labels', () => {
    const labels = NAV_LINKS.map((l) => l.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe('GISCUS', () => {
  it('has a repo in the owner/repo format', () => {
    expect(GISCUS.repo).toMatch(/^[\w-]+\/[\w.-]+$/);
  });

  it('has a non-empty repoId', () => {
    expect(GISCUS.repoId).toBeTruthy();
  });

  it('has a valid mapping value', () => {
    const validMappings = ['pathname', 'url', 'title', 'og:title', 'specific', 'number'];
    expect(validMappings).toContain(GISCUS.mapping);
  });
});

describe('isCommentsConfigured', () => {
  it('returns a boolean', () => {
    expect(typeof isCommentsConfigured()).toBe('boolean');
  });

  it('returns false when GISCUS.categoryId is empty', () => {
    // The current config has an empty categoryId
    if (GISCUS.categoryId === '') {
      expect(isCommentsConfigured()).toBe(false);
    }
  });
});
