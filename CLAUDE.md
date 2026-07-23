# CLAUDE.md

> Persistent instructions for Claude Code sessions on this repository.

## Project Overview

Personal blog & portfolio for Kunal Suri. Static site built with **Astro 7**, **Tailwind CSS v4**, **TypeScript (strict)**, and **Preact** (islands). Deployed to **GitHub Pages** via GitHub Actions on every push to `main`.

Live: https://kunalsuri.github.io

## Architecture

```
src/
├── components/     # Astro components (BaseHead, Header, Footer, PostCard, ThemeToggle, Comments, FormattedDate)
├── content/blog/   # Markdown / MDX blog posts (glob-loaded via Content Layer)
├── layouts/        # BaseLayout.astro, BlogPost.astro
├── pages/          # Route files (index, about, archive, search, rss.xml.js, blog/[...slug], tags/, categories/)
├── styles/         # global.css — Tailwind v4 CSS-first config (no tailwind.config.js)
├── utils/          # posts.ts, reading-time.ts, taxonomy.ts
├── consts.ts       # Site-wide constants (SITE_TITLE, SOCIAL, NAV_LINKS, GISCUS)
└── content.config.ts  # Astro Content Layer schema (title, description, pubDate, category, tags, draft)
public/             # Static assets (favicon.svg only)
```

## Essential Commands & Helper Scripts (Token-Efficient Workflow)

> **REDUCE TOKEN WASTAGE:** Always prefer running the consolidated helper scripts in `scripts/` to verify setup, npm dependencies, tests, and builds in a single step rather than running multiple fragmented commands.

### Automated Setup & Verification Scripts
- **Windows (PowerShell):**
  - Setup & NPM test: `.\scripts\win\dev-setup.ps1` (install deps + type check)
  - Full Test & Build: `.\scripts\win\dev-tests.ps1` (type check + unit tests + integration tests + build)
  - Dev Server: `.\scripts\win\dev-run.ps1`
- **Linux / macOS (Bash):**
  - Setup & NPM test: `./scripts/linux/dev-setup.sh` (install deps + type check)
  - Full Test & Build: `./scripts/linux/dev-tests.sh` (type check + unit tests + integration tests + build)
  - Dev Server: `./scripts/linux/dev-run.sh`

### Individual NPM Commands (Targeted Use Only)
```bash
npm install          # Install dependencies
npm run check        # Type-check with astro check
npm run test:unit    # Fast unit tests only
npm run test:integration # Integration tests only
npm run build        # Production build → dist/
npm run dev          # Dev server → http://localhost:4321
npm run preview      # Preview production build locally
```

Pagefind search index builds automatically via the `postbuild` script (`pagefind --site dist`).

## Coding Rules

- Use **TypeScript strict** mode. Never add `// @ts-ignore` or `any` without explaining why.
- Use **Astro components** (`.astro`) for all UI. Use **Preact** (`.tsx`) only for interactive islands that require client-side state.
- Styling is **Tailwind CSS v4** via the Vite plugin — all config lives in `src/styles/global.css`. There is no `tailwind.config.js`.
- Import paths: use relative paths within `src/`. No `@/` alias is configured.
- Prefer **named exports**. Default exports only where Astro/framework requires them.
- Content schema is defined in `src/content.config.ts`. If you add a frontmatter field, add it to the Zod schema there.
- Keep components small and focused. Do not create "god components."

## Blog Post Conventions

Posts live in `src/content/blog/` as `.md` or `.mdx`. Required frontmatter:

```yaml
title: "Post Title"
description: "One-line summary for SEO and post list."
pubDate: 2026-07-09
tags: ["tag"]
```

Optional: `updatedDate`, `category` (defaults to "Notes"), `draft` (defaults to false; draft posts are hidden in production).

The filename becomes the URL slug: `my-post.md` → `/blog/my-post/`.

## Deployment

- Push to `main` triggers `.github/workflows/deploy.yml`.
- Uses `withastro/action` to build and deploy to GitHub Pages.
- **Never commit directly to `main` without verifying the build passes locally.**

## Verification Checklist (Token-Saving Protocol)

Before finishing any task, run the automated verification script to execute all checks in a single step and reduce token usage:

- **Windows (PowerShell):** `.\scripts\win\dev-tests.ps1`
- **Linux / macOS (Bash):** `./scripts/linux/dev-tests.sh`

This script executes all 4 gates in one pass:
1. `npm run check` — must pass with zero errors.
2. `npm run test:unit` & `npm run test:integration` — unit and integration tests must pass.
3. `npm run build` — production build must complete without errors.
4. Visually confirm dev server (`npm run dev` / `dev-run`) if UI was changed.

## Licensing — Do Not Violate

- Source code: **Apache License 2.0** (`LICENSE`).
- Blog content in `src/content/blog/`: **CC BY 4.0** (`CONTENT_LICENSE`). Do not copy or relocate blog content without attribution.

## Things to Avoid

- Do not install Prettier, ESLint, or any new linter without asking first.
- Do not add React — use Preact with compat (`jsxImportSource: "preact"` in tsconfig).
- Do not create a `tailwind.config.js` — Tailwind v4 is CSS-first.
- Do not modify the GitHub Actions workflow without asking first.
- Do not store secrets, API keys, or credentials anywhere in the repo.
