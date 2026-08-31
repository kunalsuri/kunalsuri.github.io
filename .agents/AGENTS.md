# AGENTS.md

> Project instructions for AI agents and Anti-gravity sessions on this repository.
> Follows the open [AGENTS.md](https://agents.md) standard. Exact mirror of root [AGENTS.md](../AGENTS.md) and [CLAUDE.md](../CLAUDE.md).

## Project Overview

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
npm run test         # Run full Vitest test suite
npm run test:unit    # Fast unit tests only (tests/unit)
npm run test:integration # Integration tests only (tests/integration)
npm run verify:post -- <slug>  # Mechanical pre-publish gate for one post
npm run verify:posts     # Same gate across every post
npm run build        # Production build to dist/
npm run dev          # Start dev server at http://localhost:4321
npm run preview      # Preview the built site locally
```

The `postbuild` script runs Pagefind automatically (`pagefind --site dist`) to generate the static search index.

## Architecture Map

```
├── astro.config.mjs        # Astro config — site URL, integrations (MDX, Sitemap, Preact), Tailwind v4 Vite plugin, Studio plugin
├── studio-server-plugin.mjs # Dev-only Vite plugin for Studio local backend (posts CRUD, asset serving, image search, link unfurl)
├── tsconfig.json            # Extends astro/tsconfigs/strict, JSX → Preact
├── vitest.config.ts         # Vitest test configuration
├── package.json             # Scripts, deps (Astro 7, Preact, Tailwind v4, Pagefind, Vitest)
├── AGENTS.md                # Agent instructions (mirrored with CLAUDE.md)
├── CLAUDE.md                # Claude Code instructions (mirrored with AGENTS.md)
├── .agents/                 # Workspace customizations root
│   └── AGENTS.md            # Mirror of AGENTS.md rules for Anti-gravity workspace root
├── CHANGELOG.md             # Keep a Changelog release notes
├── SECURITY.md              # Security vulnerability reporting & automated tooling policies
├── src/
│   ├── consts.ts            # Site-wide constants: SITE_TITLE, SITE_URL, AUTHOR, SOCIAL, NAV_LINKS, GISCUS
│   ├── content.config.ts    # Content Layer schema (Zod): title, description, pubDate, category, tags, draft
│   ├── components/          # Astro & Preact components: BaseHead, Header, Footer, PostCard, SeriesNav, ThemeToggle, Comments, studio/
│   ├── layouts/             # BaseLayout.astro (site chrome), BlogPost.astro (post wrapper)
│   ├── pages/               # Routes: index, about, archive, search, rss.xml.js, llms.txt.ts, llms-full.txt.ts, blog/, tags/, categories/, series/, studio/, api/
│   ├── styles/global.css    # Tailwind CSS v4 config (CSS-first, no tailwind.config.js)
│   ├── utils/               # posts.ts (query helpers), reading-time.ts, taxonomy.ts (tag/category extraction), series.ts (series ordering & context), studio-fs.ts
│   └── content/blog/        # Blog posts as .md / .mdx — filename or folder/index.md = URL slug
├── tests/                   # Vitest test suite
│   ├── unit/                # Unit tests: consts, markdown-preview, reading-time, series, studio-fs, studio, taxonomy, verify-post (8 test suites)
│   └── integration/         # Integration tests: ai-discoverability, blog-posts, build, content-schema, ensure-build, reader-experience, rss, series (8 test suites)
├── docs/series/             # "What Is" series playbook, idea backlog, and per-post verification reports
├── .claude/skills/          # Agent Skills (mirrored to .agents/skills/)
│   ├── what-is-post/        # Series house style — Claude loads this automatically
│   ├── what-is-draft/       # /what-is-draft — human-invoked
│   ├── what-is-verify/      # /what-is-verify — human-invoked
│   ├── what-is-publish/     # /what-is-publish — human-invoked, never auto-run
│   └── what-is-status/      # /what-is-status — read-only, Claude may invoke
├── scripts/                 # Token-efficient Windows & Linux dev scripts
│   └── verify-post.mjs      # Mechanical pre-publish gate for blog posts (npm run verify:post)
├── public/                  # Static assets (favicon.svg)
├── .github/                 # dependabot.yml (weekly updates) & workflows/ (ci.yml, codeql-analysis.yml, deploy.yml, dependabot-automerge.yml)
├── LICENSE                  # Apache 2.0 (source code)
└── CONTENT_LICENSE          # CC BY 4.0 (blog content)
```

## Code Style & AI Web Development Rules

- **TypeScript strict mode** — do not add `@ts-ignore` or `any` without justification.
- **Astro components** (`.astro`) for static UI. Use Preact (`.tsx`) islands only when client-side interactivity is required.
- **Tailwind CSS v4** — configured as a Vite plugin. All theme config lives in `src/styles/global.css`. There is **no** `tailwind.config.js`.
- **Modern Web Aesthetics** — prioritize visual excellence, smooth transitions, responsive layouts, clear color contrast, dark mode compatibility, and clean typography (Inter / System font stack).
- **Named exports** preferred. Default exports only where required by framework conventions.
- **Relative imports** within `src/`. No path aliases are configured.
- Keep components small, focused, and reusable. Do not create "god components."

## Content Schema & Blog Posts

Posts in `src/content/blog/` must include this frontmatter:

```yaml
title: "Post Title"
description: "SEO summary."
pubDate: 2026-07-09
```

Optional fields: `updatedDate` (date), `category` (string, default "Notes"), `tags` (string[], default []), `draft` (boolean, default false), `series` (string), `seriesOrder` (positive integer).

**`category` vs `series`** — they are orthogonal and must not be collapsed. `category` is the *section* a post is filed under (Engineering, Notes …); `series` is the *thread* it belongs to ("What Is"). A post can be both. Never set `category: "What Is"`.

`seriesOrder` is optional: omit it and posts sort by `pubDate` within the series. Set it only when reading order must differ from publication order.

The Zod schema is defined in `src/content.config.ts`. Any new frontmatter field **must** be added there.

Slug resolution supports both flat files (`my-post.md` → `/blog/my-post/`) and folder index files (`my-post/index.md` → `/blog/my-post/`).

## Testing & Verification (Token-Efficient Checklist)

Before marking work complete, agents **must** run the consolidated verification script to execute type-checking, unit tests, integration tests, and production build in a single step, saving token usage:

- **Windows (PowerShell):** `.\scripts\win\dev-tests.ps1`
- **Linux / macOS (Bash):** `./scripts/linux/dev-tests.sh`

This script executes all 4 required gates in one pass:
1. `npm run check` — type check (zero errors)
2. `npm run test:unit` — unit tests (8 test suites)
3. `npm run test:integration` — integration tests (8 test suites)
4. `npm run build` — production build (+ Pagefind index)

For blog content specifically, also run `npm run verify:post -- <slug>` — the mechanical publish gate (schema shape, house-style structure, length, leftover placeholders). It runs inside `tests/integration/series.test.ts` too, so a malformed post fails CI.

> **Debugging Note:** For fast targeted iteration during local debugging, agents may run `npm run test:unit` or `npm run check` individually.

If UI was changed, visually verify with `npm run dev`.

## Post Series & the Draft → Verify → Publish Pipeline

A **series** is an ordered run of posts sharing a spine. Declaring `series: "<Name>"` in front-matter is all it takes: `/series` and `/series/<slug>` build themselves, the post gets in-article series navigation, and the series appears in `/llms.txt` in reading order. Add a blurb for a series by adding an entry to `SERIES_META` in `src/consts.ts`. No route or component work is needed to start a new series.

Series posts sort **oldest-first** (reading order), unlike every other listing on the site, which is newest-first.

### The "What Is …" series

`docs/series/what-is-playbook.md` is the single source of truth for the series' house style, structure, front-matter, and verification gate. The skills and `scripts/verify-post.mjs` all defer to it — **change the playbook, not the copies**.

The pipeline is built from **Agent Skills**, not the legacy `.claude/commands/` format — Anthropic merged custom commands into skills, and skills are the supported forward path. A skill directory name is the command you type, so `.claude/skills/what-is-draft/` gives you `/what-is-draft`.

The three stage skills set `disable-model-invocation: true`, so Claude cannot run them on its own — it can only suggest that you do. That is what mechanically enforces the human review turn below; `/what-is-publish` in particular can never fire without you. `what-is-post` carries the house style and loads automatically when relevant, and `/what-is-status` is read-only so Claude may invoke it freely.

The pipeline is deliberately three separate turns, so a human reviews between drafting and publishing:

| Stage | Command | Result |
|---|---|---|
| Draft | `/what-is-draft <topic>` | `src/content/blog/what-is-<slug>/index.md` with `draft: true`; uncertain claims marked `[?]` |
| Verify | `/what-is-verify <slug>` | Mechanical gate + source-checked factual review, written to `docs/series/reviews/<slug>.md` |
| Publish | `/what-is-publish <slug>` | `draft: false`, full test suite, commit |
| Status | `/what-is-status` | Pipeline state and any drift |

Rules that agents **must** honour:

- **Never draft and publish in the same turn.** The human review turn is the point of the pipeline.
- **Never ship a factual claim that was not checked against a current primary source this session.** Definitions assembled from memory are the exact failure this series exists to avoid.
- **`[?]` markers block publishing.** `scripts/verify-post.mjs` treats them as hard errors. Resolve them; never strip them to pass the gate.
- **Drafts live in `src/content/blog/` with `draft: true`**, not in `docs/drafts/`. Drafts are hidden from production builds but visible in `npm run dev`, so a post is reviewed exactly as it will look. `docs/drafts/` is only for imported or half-abandoned pieces.
- Publishing requires an existing `docs/series/reviews/<slug>.md`.

Idea capture lives in `docs/series/what-is-backlog.md` — one line per idea, deliberately unscheduled.

## Deployment & CI/CD

- Every push to `main` triggers `.github/workflows/deploy.yml`.
- Build uses `withastro/action` and publishes to GitHub Pages automatically.
- Pull requests and pushes run automated testing via `.github/workflows/ci.yml` and CodeQL analysis via `.github/workflows/codeql-analysis.yml`.
- Do not modify CI/CD workflows without explicit approval.

## Constraints & Guardrails

- **No React** — this project uses Preact with the compatibility shim (`jsxImportSource: "preact"`).
- **No `tailwind.config.js`** — Tailwind v4 is CSS-first; config is in `src/styles/global.css`.
- **No new linters or formatters** (Prettier, ESLint, etc.) unless explicitly requested.
- **Do not commit secrets**, API keys, or credentials.
- **Respect the dual license**: source code is Apache 2.0 (`LICENSE`); blog content (`src/content/blog/`) is CC BY 4.0 (`CONTENT_LICENSE`).
- **Do not push directly to `main`** without verifying the build passes.

## Special Features & Workflow Notes

- **Claude / Anti-gravity / AGENTS Mirroring**: `CLAUDE.md`, `AGENTS.md`, and `.agents/AGENTS.md` are exact content mirrors and must be kept updated in lockstep.
- **AI Discoverability**: `/llms.txt` and `/llms-full.txt` provide LLM-friendly documentation feeds.
- **Studio CMS Environment**: Local interactive post management available at `/studio` in dev mode (`npm run dev`), powered by `studio-server-plugin.mjs` middleware (supporting post CRUD, image search/upload, link unfurling, and WebSocket HMR reload suppression for post editing).
- **Giscus Comments**: Pre-wired in `src/consts.ts` and `src/components/Comments.astro` (requires `categoryId` when activated).
- **RSS & Sitemap**: RSS feed at `/rss.xml`; sitemap at `/sitemap-index.xml`.
