# AGENTS.md

> A README for AI coding agents — context and rules for working on this repository.
> Follows the open [AGENTS.md](https://agents.md) standard.

## Project

**kunalsuri.github.io** — Kunal Suri's personal blog & portfolio.
Static site: [Astro 7](https://astro.build) · [Tailwind CSS v4](https://tailwindcss.com) · TypeScript (strict) · [Preact](https://preactjs.com) islands.
Deployed via GitHub Actions → GitHub Pages.

Live site: https://kunalsuri.github.io

## Setup & Development Scripts (Token Efficient)

To reduce token wastage and avoid multi-turn prompt overhead, agents **MUST** use the automated setup and verification scripts located in `scripts/` instead of running multiple fragmented terminal commands:

### Windows (PowerShell)
```powershell
.\scripts\win\dev-setup.ps1   # Token-efficient setup: install deps + type check
.\scripts\win\dev-tests.ps1   # Token-efficient test: type check + unit tests + integration tests + build
.\scripts\win\dev-run.ps1     # Dev server → http://localhost:4321
```

### Linux / macOS (Bash)
```bash
./scripts/linux/dev-setup.sh  # Token-efficient setup: install deps + type check
./scripts/linux/dev-tests.sh  # Token-efficient test: type check + unit tests + integration tests + build
./scripts/linux/dev-run.sh    # Dev server → http://localhost:4321
```

> **TOKEN SAVING RULE:** Running `dev-setup` or `dev-tests` bundles setup, dependencies testing, type checking, unit tests, integration tests, and production build into a single command execution, saving context tokens and conversation turns.

### Individual NPM Commands
Use individual npm commands only when debugging a specific component:
```bash
npm install          # Install all dependencies
npm run check        # Run astro check (type-checking)
npm run test:unit    # Fast unit tests only
npm run test:integration # Integration tests only
npm run build        # Production build to dist/
npm run dev          # Start dev server at http://localhost:4321
npm run preview      # Preview the built site locally
```

The `postbuild` script runs Pagefind automatically (`pagefind --site dist`) to generate the static search index.

## Architecture Map

```
├── astro.config.mjs        # Astro config — site URL, integrations (MDX, Sitemap, Preact), Tailwind v4 Vite plugin
├── tsconfig.json            # Extends astro/tsconfigs/strict, JSX → Preact
├── package.json             # Scripts, deps (Astro 7, Preact, Tailwind v4, Pagefind)
├── src/
│   ├── consts.ts            # Site-wide constants: SITE_TITLE, SITE_URL, AUTHOR, SOCIAL, NAV_LINKS, GISCUS
│   ├── content.config.ts    # Content Layer schema (Zod): title, description, pubDate, category, tags, draft
│   ├── components/          # Astro components: BaseHead, Header, Footer, PostCard, ThemeToggle, Comments, FormattedDate
│   ├── layouts/             # BaseLayout.astro (site chrome), BlogPost.astro (post wrapper)
│   ├── pages/               # Routes: index, about, archive, search, rss.xml.js, blog/[...slug], tags/, categories/
│   ├── styles/global.css    # Tailwind CSS v4 config (CSS-first, no tailwind.config.js)
│   ├── utils/               # posts.ts (query helpers), reading-time.ts, taxonomy.ts (tag/category extraction)
│   └── content/blog/        # Blog posts as .md / .mdx — filename = URL slug
├── public/                  # Static assets (favicon.svg)
├── .github/workflows/       # deploy.yml — CI/CD via withastro/action
├── LICENSE                  # Apache 2.0 (source code)
└── CONTENT_LICENSE          # CC BY 4.0 (blog content)
```

## Code Style

- **TypeScript strict mode** — do not add `@ts-ignore` or `any` without justification.
- **Astro components** (`.astro`) for all UI. Use Preact (`.tsx`) only when client-side interactivity is required.
- **Tailwind CSS v4** — configured as a Vite plugin. All theme config lives in `src/styles/global.css`. There is **no** `tailwind.config.js`.
- **Named exports** preferred. Default exports only where required by framework conventions.
- **Relative imports** within `src/`. No path aliases are configured.
- Keep components small, focused, and reusable.

## Content Schema

Posts in `src/content/blog/` must include this frontmatter:

```yaml
title: "Post Title"
description: "SEO summary."
pubDate: 2026-07-09
```

Optional fields: `updatedDate` (date), `category` (string, default "Notes"), `tags` (string[], default []), `draft` (boolean, default false).

The Zod schema is defined in `src/content.config.ts`. Any new frontmatter field **must** be added there.

## Testing & Verification (Token-Efficient Checklist)

Before marking work complete, agents **must** run the consolidated verification script to execute type-checking, unit tests, integration tests, and production build in a single step, saving token usage:

- **Windows (PowerShell):** `.\scripts\win\dev-tests.ps1`
- **Linux / macOS (Bash):** `./scripts/linux/dev-tests.sh`

This script executes all 4 required gates in one pass:
1. `npm run check` — type check (zero errors)
2. `npm run test:unit` — unit tests
3. `npm run test:integration` — integration tests
4. `npm run build` — production build (+ Pagefind index)

> **Debugging Note:** For fast targeted iteration during local debugging, agents may run `npm run test:unit` or `npm run check` individually.

If UI was changed, visually verify with `npm run dev`.

## Deployment

- Every push to `main` triggers `.github/workflows/deploy.yml`.
- Build uses `withastro/action` and publishes to GitHub Pages automatically.
- Do not modify the deploy workflow without explicit approval.

## Constraints & Guardrails

- **No React** — this project uses Preact with the compatibility shim (`jsxImportSource: "preact"`).
- **No `tailwind.config.js`** — Tailwind v4 is CSS-first; config is in `src/styles/global.css`.
- **No new linters or formatters** (Prettier, ESLint, etc.) unless explicitly requested.
- **Do not commit secrets**, API keys, or credentials.
- **Respect the dual license**: source code is Apache 2.0; blog content (`src/content/blog/`) is CC BY 4.0.
- **Do not push directly to `main`** without verifying the build passes.

## Workflow Notes

- The `.claude/` directory contains local Claude Code settings — do not commit agent-specific state.
- The Giscus comment system is pre-wired in `src/consts.ts` but not yet activated (requires `categoryId`).
- RSS feed is at `/rss.xml`; sitemap at `/sitemap-index.xml`.
