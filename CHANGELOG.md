# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Standard `CHANGELOG.md` file to track release history and synchronize future software releases.
- AI discoverability feed endpoints (`/llms.txt`, `/llms-full.txt`) and Studio CMS environment references across core documentation.

### Changed
- Synchronized `AGENTS.md` and `CLAUDE.md` as exact instruction mirrors following the open AGENTS.md standard.
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
