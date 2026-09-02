# Publish Draft — Technical Reference Guide

> Level 3 on-demand reference documentation for the `publish-draft` skill.
> Conforms to the [Agent Skills Open Standard](https://agentskills.io/).

---

## 1. Astro 7 Content Collections Architecture

This repository uses Astro 7 Content Collections with the `glob` loader. Blog posts support both flat markdown files and folder-based packages:

```
src/content/blog/
├── my-flat-post.md                     # Flat file (slug: my-flat-post)
└── my-folder-post/                     # Folder package (slug: my-folder-post)
    ├── index.md                        # Primary markdown entrypoint
    ├── hero-diagram.svg                # Co-located vector asset
    └── architecture-flow.png           # Co-located image asset
```

### Folder Post Standard (`index.md`)
- The primary post file must be named `index.md` or `index.mdx`.
- Any image or diagram placed in the same folder can be referenced with a simple relative path in markdown:
  ```markdown
  ![Architecture Diagram](./architecture-flow.png)
  ```
- Astro's asset pipeline and Studio CMS automatically resolve and bundle co-located assets at build and dev time.

---

## 2. Supported Asset Types

When moving or copying draft folders from `docs/drafts/` to `src/content/blog/`, the following asset extensions are automatically preserved and transferred:

| Asset Type | Extensions | Use Case |
|---|---|---|
| **Raster Images** | `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.avif` | Photos, screenshots, diagrams |
| **Vector Graphics** | `.svg` | High-fidelity scalable diagrams, logos |
| **Diagram Files** | `.excalidraw`, `.drawio` | Editable source drawings co-located with posts |
| **Auxiliary Data** | `.json`, `.csv` | Embedded dataset references |

---

## 3. Frontmatter Schema & Zod Definition

Defined in `src/content.config.ts`:

```typescript
const blog = defineCollection({
  loader: glob({ pattern: ['**/*.md', '**/*.mdx'], base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    category: z.string().default('Notes'),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    series: z.string().optional(),
    seriesOrder: z.number().int().positive().optional(),
  }),
});
```

### Key Field Rules:
- **`draft` (boolean)**: When `true`, post is visible in local dev mode (`npm run dev`) and Studio CMS (`/studio`), but excluded from production builds.
- **`category` vs `series`**:
  - `category` = The section/topic (e.g., `Engineering`, `AI`, `Notes`, `Philosophy`).
  - `series` = The editorial spine/thread (e.g., `What Is`).
  - *Never* set `category: "What Is"`.

---

## 4. Verification Gates

1. **Pre-Publish Gate (`scripts/verify-post.mjs`)**:
   ```bash
   node scripts/verify-post.mjs <slug>
   ```
   Checks schema shape, description length (<= 160 chars), placeholder markers (`TODO`, `TKTK`, `FIXME`, `[?]`), and dead placeholder links.

2. **Repository Full Verification Gate**:
   - **Windows:** `.\scripts\win\dev-tests.ps1`
   - **Linux / macOS:** `./scripts/linux/dev-tests.sh`
   Runs `npm run check`, `npm run test:unit`, `npm run test:integration`, and `npm run build` in a single pass.
