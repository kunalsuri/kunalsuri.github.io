<div align="center">

# 🚀 Kunal's Personal Page

**Essasys, Opinions and Ideas on Philosophy, Leadership, AI, Tech and whatever I am building...**

<br>

[![Astro](https://img.shields.io/badge/Astro_7-BC52EE?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-222222?style=for-the-badge&logo=github&logoColor=white)](https://kunalsuri.github.io)

[🌐 **Live Site →**](https://kunalsuri.github.io) &nbsp;·&nbsp; [📚 Blog](https://kunalsuri.github.io/blog) &nbsp;·&nbsp; [📜 Changelog](CHANGELOG.md) &nbsp;·&nbsp; [🛡️ Security](SECURITY.md)
</div>

<br>

---

> [!TIP]
> **Please feel free to reuse the source code to create your own Personal Page / Blog.**

<br>

## NOTE: Using the Source Code & Blog Content

The source code is available under the **Apache License 2.0**. You are free to use, modify, and distribute it — see [`LICENSE`](LICENSE) for full terms.

### Citing Blog Content

The blog content is Kunal Suri's intellectual property, released under **Creative Commons Attribution 4.0 International (CC BY 4.0)**. You are welcome to share and adapt it, but **proper attribution is required**.

<br>

**Suggested Citation Format (IF Needed):**

> Suri, K. "Post Title." *Kunal Suri's Blog.*
> Available at: `https://kunalsuri.github.io/`
> DOI: *to be assigned via [Zenodo](https://zenodo.org)*

A persistent DOI for the full archive will be made available via [Zenodo](https://zenodo.org) in the future. Once assigned, please prefer the DOI link for long-term citation stability (if needed).

<br>

---

## 🚀 Tech Stack & Deployment

<br>

 <details>
   <summary><b>🛠️ CLICK HERE: Details on Technical Stack & How to Use the Codebase </b> 🔽</summary>

<br>

## ✨ Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Framework** | [Astro 7](https://astro.build) — static output, zero JS by default |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) — CSS-first config via `src/styles/global.css` |
| **Language** | [TypeScript](https://www.typescriptlang.org) (strict) + `astro check` |
| **Islands** | [Preact](https://preactjs.com) (compat) — ready for interactivity when needed |
| **Search** | [Pagefind](https://pagefind.app) — static search index, built post-build |
| **Feeds & AI** | RSS (`/rss.xml`), Sitemap (`/sitemap-index.xml`), AI discoverability (`/llms.txt`, `/llms-full.txt`) |
| **CMS Environment** | Studio local interactive CMS (`/studio` dev route via Vite middleware plugin) |
| **Deployment** | GitHub Actions → GitHub Pages (automatic on push to `main`) |

<br>

---

## 🛠️ Local Development

> **Prerequisites:** Node.js 20+ (24 recommended)

```bash
# Install dependencies
npm install

# Start dev server → http://localhost:4321
npm run dev

# Production build → dist/
npm run build

# Preview the production build locally
npm run preview

# Type-check with astro check
npm run check
```

<br>

---

## 🧪 Testing

The project includes an extensive **Vitest** test suite covering unit tests, content validation, build output, reader experience, AI discoverability, and SEO integrity.

### Quick Start

```bash
# Run the full test suite (unit + integration)
npm test

# Run only unit tests (fast, no build needed)
npm run test:unit

# Run only integration tests (triggers a build if dist/ is missing)
npm run test:integration

# Run tests in watch mode during development
npm run test:watch
```

### Test Architecture

```
tests/
├── unit/                       # Fast, pure-function & module tests (no Astro runtime)
│   ├── consts.test.ts          # Site constants — shape and value guards
│   ├── markdown-preview.test.ts# Live markdown preview & asset URL rewrites
│   ├── reading-time.test.ts    # readingTime() — word count and edge cases
│   ├── series.test.ts          # Series grouping, reading order & in-post context
│   ├── studio-fs.test.ts       # Studio local filesystem operations & post file handling
│   ├── studio.test.ts          # Studio state & management utilities
│   ├── taxonomy.test.ts        # slugify() — URL-safe slug generation
│   └── verify-post.test.ts     # The mechanical pre-publish gate
└── integration/                # File-system, reader-experience, and build-output tests
    ├── ai-discoverability.test.ts# llms.txt & llms-full.txt feeds validation
    ├── blog-posts.test.ts        # Validates actual .md/.mdx files on disk
    ├── build.test.ts             # Build output — pages, SEO tags, links
    ├── content-schema.test.ts    # Zod schema for blog front-matter
    ├── ensure-build.ts           # Concurrency-safe build lock helper
    ├── reader-experience.test.ts # Layout, reading experience, and theme toggle guards
    ├── rss.test.ts               # RSS feed structure and content
    └── series.test.ts            # Series routes, front-matter integrity, publish gate
```

| Layer | What it tests | Speed |
|:------|:-------------|:------|
| **Unit** | Utility functions, constants, configuration | ⚡ < 1 s |
| **Integration (content)** | Blog post files, Zod schema | ⚡ < 1 s |
| **Integration (build)** | HTML output, SEO, RSS, links | 🐢 ~10-20 s (runs `astro build`) |

### Adding a New Test

1. Create a `.test.ts` file in the appropriate directory (`tests/unit/` or `tests/integration/`).
2. Import from `vitest`: `import { describe, it, expect } from 'vitest';`
3. Source code lives in `src/` — import utilities directly (e.g., `import { slugify } from '../../src/utils/taxonomy';`).
4. Run `npm test` to verify.

<br>

---

## ✍️ Writing a Post

Drop a Markdown (`.md`) or MDX (`.mdx`) file into `src/content/blog/`:

```md
---
title: "Your title"
description: "One-line summary, used for SEO and the post list."
pubDate: 2026-07-09
tags: ["astro"]
draft: false      # true → hidden in production, visible in dev
---

Your content here.
```

The filename becomes the URL slug — `my-post.md` → `/blog/my-post/`.

### Post series

Add `series: "What Is"` to the front-matter and the post joins a series: `/series` and `/series/what-is` build themselves, and the post gets in-article "Part 2 of 5" navigation. `series` is the *thread*; `category` is still the *section* — a post has both. Add optional `seriesOrder: 3` only when reading order must differ from publication order.

### Draft → verify → publish

Posts are drafted with `draft: true` (hidden in production, visible in `npm run dev`), verified, then published by flipping one boolean. The mechanical gate is a plain Node script:

```bash
npm run verify:post -- what-is-an-llm   # one post
npm run verify:posts                    # every post
```

For the "What Is" series there is a full authoring pipeline — playbook, idea backlog, Claude Code slash commands (`/what-is-draft`, `/what-is-verify`, `/what-is-publish`, `/what-is-status`), and per-post verification reports. See [`docs/series/what-is-playbook.md`](docs/series/what-is-playbook.md).

<br>

---

## 🚢 Deployment

Every push to `main` triggers the CI/CD pipeline:

1. [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs on GitHub Actions
2. Builds via the official [`withastro/action`](https://github.com/withastro/action)
3. Publishes to GitHub Pages automatically

<br>

**No local build required.**

> **One-time setup:** GitHub → **Settings** → **Pages** → **Build and deployment** → Source → **"GitHub Actions"**

 </details>

<br>

---

## 📄 License

This project uses a **dual-license** model:

| What | License | File |
|:-----|:--------|:-----|
| **Source code** — templates, components, config, styles, scripts | [Apache License 2.0](LICENSE) | [`LICENSE`](LICENSE) |
| **Blog content** — posts, articles, and essays in `src/content/blog/` | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | [`CONTENT_LICENSE`](CONTENT_LICENSE) |

<br>

<br>

<div align="center">

**Built with ☕ and curiosity by [Kunal Suri](https://github.com/kunalsuri)**

</div>
