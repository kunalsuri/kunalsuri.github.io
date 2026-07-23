// Site-wide constants. Edit these to make the site yours.

export const SITE_TITLE = 'Kunal Suri';
export const SITE_DESCRIPTION =
  'My thoughts and ideas, primarily around building products and systems using AI.';

// Used for canonical URLs, RSS, and sitemap. Must match your GitHub Pages URL.
export const SITE_URL = 'https://kunalsuri.github.io';

export const AUTHOR = 'Kunal Suri';

// A one-line thesis for the hero. This is your voice — rewrite it.
export const SITE_TAGLINE =
  'I write about my opinions, ideas, and philosophy — primarily around AI, tech, and leadership, but not limited to it.';

export const SOCIAL = {
  github: 'https://github.com/kunalsuri',
  linkedin: 'https://www.linkedin.com/in/kunalsuri/',
  substack: 'https://substack.com/@kunalsuri',
  // Uncomment to expose these publicly:
  // email: 'you@example.com',
  // x: 'https://x.com/yourhandle',
};

export const NAV_LINKS = [
  { href: '/blog', label: 'Writing' },
  { href: '/archive', label: 'Archive' },
  { href: '/about', label: 'About' },
];

/*
  giscus comments (GitHub Discussions-backed).
  repo + repoId are pre-filled. To switch comments ON:
    1. Repo Settings → General → Features → enable "Discussions".
    2. Install the giscus app: https://github.com/apps/giscus (grant this repo).
    3. Visit https://giscus.app, enter kunalsuri/kunalsuri.github.io, pick the
       "Announcements" category, and copy its data-category-id below.
  Comments render only once `categoryId` is set, so the build stays clean.
*/
export const GISCUS = {
  repo: 'kunalsuri/kunalsuri.github.io' as const,
  repoId: 'R_kgDOTTNbyA',
  category: 'Announcements',
  categoryId: '', // ← paste from giscus.app after enabling Discussions
  mapping: 'pathname' as const,
  reactionsEnabled: '1' as const,
};

export const isCommentsConfigured = () => GISCUS.categoryId.length > 0;

/*
  Privacy-conscious Analytics (Cloudflare Web Analytics, GoatCounter, etc.)
  Add your token/code below when ready. Leaves zero cookies and respects privacy.
*/
export const ANALYTICS = {
  cloudflareToken: '', // ← e.g. "a1b2c3d4e5f6..." from Cloudflare Web Analytics dashboard
  goatcounterCode: '', // ← e.g. "kunalsuri" from GoatCounter dashboard
};

/*
  Newsletter & Updates Subscription Settings
*/
export const NEWSLETTER = {
  title: 'Follow the Writing',
  description: 'No email collection on this site. Connect on your preferred platform for long-form essays, short updates, or raw feeds.',
  substackUrl: 'https://substack.com/@kunalsuri',
  linkedinUrl: 'https://www.linkedin.com/in/kunalsuri/',
  rssUrl: '/rss.xml',
};

