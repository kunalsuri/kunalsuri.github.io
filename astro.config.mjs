// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';
import { studioServerPlugin } from './studio-server-plugin.mjs';

// https://astro.build/config
export default defineConfig({
  // This is a GitHub Pages *user* site (kunalsuri.github.io), served from the
  // domain root — so `site` is the full origin and `base` stays the default '/'.
  // (A *project* repo would instead need `base: '/repo-name'`.)
  site: 'https://kunalsuri.github.io',

  integrations: [
    mdx(), // lets a post embed components (.mdx); plain .md still works
    sitemap(), // emits /sitemap-index.xml for search engines
    preact({ compat: true }), // interactive islands, React-compat shim on
  ],

  vite: {
    // Tailwind CSS v4 is wired in as a Vite plugin (no tailwind.config.js);
    // the config lives in src/styles/global.css. studioServerPlugin runs
    // Studio's dev-only backend (posts CRUD, image search/download, local
    // asset serving) — see its own file for why this has to be a Vite
    // middleware rather than Astro API routes.
    plugins: [tailwindcss(), studioServerPlugin()],
  },
});
