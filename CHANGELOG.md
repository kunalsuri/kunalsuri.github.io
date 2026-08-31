# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Post series support**: optional `series` and `seriesOrder` front-matter fields, a `/series` index and `/series/[series]` detail route, in-article series navigation (`SeriesNav.astro`), a series badge on post cards, and `SERIES_META` editorial copy in `src/consts.ts`. Series posts list oldest-first (reading order); `seriesOrder` overrides `pubDate` when reading order must differ from publication order.
- **"What Is …" authoring pipeline**: `docs/series/what-is-playbook.md` (single source of truth for house style and the verification gate), `docs/series/what-is-backlog.md` (idea capture), per-post verification reports in `docs/series/reviews/`, and five Agent Skills in `.claude/skills/` (mirrored to `.agents/skills/`): `what-is-post` for house style plus `/what-is-draft`, `/what-is-verify`, `/what-is-publish` and `/what-is-status`. The three stage skills set `disable-model-invocation: true`, so Claude cannot draft or publish on its own initiative — the human review turn is enforced by the harness, not just by instructions.
- **Mechanical pre-publish gate**: `scripts/verify-post.mjs` plus `npm run verify:post` / `npm run verify:posts` — validates front-matter shape, series integrity, series house-style structure and length, and blocks unresolved `TODO`/`[?]` markers and placeholder links. Also enforced in CI via `tests/integration/series.test.ts`.
- Series fields in the Studio metadata drawer and in the `/llms.txt` and `/llms-full.txt` AI discoverability feeds (series listed in reading order).
- Two new test suites — `tests/unit/series.test.ts`, `tests/unit/verify-post.test.ts` — and `tests/integration/series.test.ts`.
- First draft in the series: `what-is-an-llm` (`draft: true`, pending factual review).
- Standard `CHANGELOG.md` file to track release history and synchronize future software releases.
- AI discoverability feed endpoints (`/llms.txt`, `/llms-full.txt`) and Studio CMS environment references across core documentation.
- `.agents/AGENTS.md` workspace customization rules file following Anti-gravity guidelines and AGENTS.md open standard.

### Changed
- Documented the series model and authoring pipeline across the `CLAUDE.md` / `AGENTS.md` / `.agents/AGENTS.md` mirrors, `README.md`, `scripts/README.md`, and `docs/templates/template-post.md`.
- Related-post scoring now de-prioritises same-series siblings, which already have dedicated series navigation.
- Synchronized `AGENTS.md`, `CLAUDE.md`, and `.agents/AGENTS.md` as exact instruction mirrors incorporating latest AI and Anti-gravity web development best practices.
- Updated `README.md` and `scripts/README.md` to detail full test architecture (6 unit and 7 integration test suites), Studio CMS integration, and security policy navigation links.

### Deprecated

### Removed

### Fixed

### Security

## [0.1.0] - 2026-07-23

### Added
- **Core Architecture & Framework**: Personal blog and portfolio built on Astro 7, Preact islands, and Tailwind CSS v4.
- **Search & Content Discovery**: Integrated Pagefind static search indexing (`postbuild`), RSS feed generation (`/rss.xml`), and XML sitemap support.
- **Testing & Quality Assurance**: Vitest unit and integration test suite covering reading-time calculation, taxonomy slugification, frontmatter schema validation, RSS feed compliance, and HTML build structure.
- **Atomic Build Locking**: Concurrency safety helper in integration test setup (`ensure-build.ts`) to prevent parallel build collisions during testing.
- **Developer Utility Scripts**: Automated Windows PowerShell (`scripts/win/`) and Linux/macOS Bash (`scripts/linux/`) developer setup, testing, and dev server scripts.
- **CI/CD & Security**: GitHub Actions workflows (`ci.yml`, `deploy.yml`) for automated site building and GitHub Pages deployment, security reporting guidelines (`SECURITY.md`), and dual-licensing structure (Apache 2.0 for code, CC BY 4.0 for blog content).
