---
name: publish-draft
description: >
  Move and publish blog drafts from docs/drafts/ into src/content/blog/ in Astro folder format
  (src/content/blog/<slug>/index.md). Automatically flips frontmatter draft status (draft: false),
  updates pubDate, preserves co-located images and diagrams, and runs pre-publish verification gates.
  Use whenever the user asks to publish a draft, move a draft to production, inspect available drafts
  in docs/drafts/, promote blog posts, or run publish-draft workflows.
license: Apache-2.0
compatibility: Requires Python 3.8+ (standard library only) and Node.js for verify-post
metadata:
  author: "Kunal Suri"
  version: "1.0.0"
  standard: "agentskills.io"
  spec-version: "1.0.0"
---

# Publish Draft Skill

Automates the transition of blog drafts from `docs/drafts/` into the production Astro content collection at `src/content/blog/`.

## How It Works

1. **Discovery & Matching**: Scans `docs/drafts/` for draft folders or standalone markdown files. Resolves exact slugs, partial names, or presents an interactive picker.
2. **Folder Normalization**: Moves the draft into `src/content/blog/<slug>/index.md` (Astro content collection folder standard). Normalizes slugs to URL-safe lowercase alphanumeric characters.
3. **Asset Preservation**: Co-locates all assets (`.jpg`, `.jpeg`, `.png`, `.webp`, `.svg`, `.gif`, `.excalidraw`) directly alongside `index.md` so relative links resolve in dev, build, and Studio CMS.
4. **Frontmatter Processing**:
   - Updates `draft: false` (or keeps `draft: true` with `--keep-draft`).
   - Updates `pubDate: YYYY-MM-DD` when `--today` or `--pub-date` is specified.
5. **Verification**: Optionally executes `node scripts/verify-post.mjs <slug>` (`--verify`) to run the mechanical pre-publish gate.

---

## Usage

Run the bundled script using standard Python:

```powershell
# Interactive picker (lists all drafts to choose from):
python .claude/skills/publish-draft/scripts/publish_draft.py

# Or via npm shortcut / root wrapper:
npm run publish:draft
python scripts/publish-draft.py
```

```bash
# Linux / macOS equivalent
python3 .claude/skills/publish-draft/scripts/publish_draft.py
python3 scripts/publish-draft.py
npm run publish:draft
```

### CLI Commands Summary

```bash
# 1. Publish a specific draft by slug or fuzzy name
python scripts/publish-draft.py 2026-09-02-understanding-agent-stack

# 2. List all available drafts in docs/drafts/
python scripts/publish-draft.py --list

# 3. Move to blog collection but keep draft: true (for Studio editing / Dev preview)
python scripts/publish-draft.py <slug> --keep-draft

# 4. Set publication date to today
python scripts/publish-draft.py <slug> --today

# 5. Publish with automated verification gate
python scripts/publish-draft.py <slug> --verify

# 6. Dry run preview (no disk modifications)
python scripts/publish-draft.py <slug> --dry-run
```

---

## Examples

### Example 1: Basic Publish Flow

**Input:** "Publish the draft on understanding the agent stack."

**Action:**
```powershell
python scripts/publish-draft.py 2026-09-02-understanding-agent-stack --today --verify
```

**Expected Output:**
- Draft folder moved from `docs/drafts/2026-09-02-understanding-agent-stack/` to `src/content/blog/2026-09-02-understanding-agent-stack/`.
- Primary markdown file renamed to `index.md`.
- Frontmatter updated: `draft: false`, `pubDate: 2026-09-02`.
- Co-located image assets preserved.
- Mechanical pre-publish gate passes cleanly.

### Example 2: Edge Case — Folder Post with Multiple Diagram Assets

**Input:** "Promote the SaaSpocalypse draft with its diagrams, but keep draft status for local review."

**Action:**
```powershell
python scripts/publish-draft.py 2026-02-08-SaaSpocalypse --keep-draft --target-slug 2026-02-08-saaspocalypse
```

**Expected Output:**
- Folder created at `src/content/blog/2026-02-08-saaspocalypse/index.md`.
- All `.jpg` and `.webp` assets copied/moved alongside `index.md`.
- Frontmatter retains `draft: true` so the post is visible at `http://localhost:4321/blog/2026-02-08-saaspocalypse/` and in Studio CMS (`/studio`), but excluded from production builds.

---

## Gotchas

- **Astro Folder Standard**: Posts in folders must be named `index.md` (or `index.mdx`), *not* `<slug>.md`. Relative image links like `![Hero](./diagram.png)` only work when co-located with `index.md`.
- **Zero Third-Party Dependencies**: The bundled Python script uses Python standard library only. Do not add external package imports (`pyyaml`, `requests`, etc.) so it executes across all environments out-of-the-box.
- **Draft Visibility in Production vs Dev**: Setting `draft: true` keeps the post accessible in local dev mode (`npm run dev`) and Studio CMS, but Astro automatically omits it from the production build (`npm run build`).
- **Series vs Category Orthogonality**: `category` (section: `Engineering`, `AI`, `Notes`) and `series` (thread: `What Is`) are orthogonal. Never set `category: "What Is"`.
- **Slug Lowercase Requirement**: URL slugs must consist strictly of lowercase alphanumeric characters and hyphens (`^[a-z0-9][a-z0-9-]*[a-z0-9]$`).
- **Target Merging**: If the destination folder `src/content/blog/<slug>/` already exists, the tool merges assets and updates `index.md` with a warning rather than failing silently.

---

## Validation

After moving and publishing a draft, run the complete repository verification gate:

1. **Execute Verification Gate:**
   - **Windows (PowerShell):** `.\scripts\win\dev-tests.ps1`
   - **Linux / macOS (Bash):** `./scripts/linux/dev-tests.sh`
2. **Verify Output:** Ensure all 4 gates pass (type check, unit tests, integration tests, production build + Pagefind search index).
3. **Local Preview:** Test locally with `npm run dev` and navigate to `http://localhost:4321/blog/<slug>/`.

---

## References

For deep technical details and schema specifications, see:
- [Technical Reference Guide](references/REFERENCE.md) — Content collections, frontmatter schema, and asset pipeline.
