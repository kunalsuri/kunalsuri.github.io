---
title: "Title of the Post"
description: "A short, engaging SEO-friendly description of the post."
pubDate: 2026-07-12
updatedDate: 2026-07-13
category: "Engineering"
tags: ["web", "guide"]
draft: false
---

This is a template file demonstrating how markdown files should be structured and styled in the blog. Place new blog post files under `src/content/blog/` (either directly as `slug-name.md` or in a nested folder as `slug-name/index.md` if co-locating images).

## Frontmatter Schema Reference

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | **Yes** | The main heading of the blog post. |
| `description` | string | **Yes** | Meta description, also displayed as the subtitle. |
| `pubDate` | YYYY-MM-DD | **Yes** | The date the post is first published. |
| `updatedDate` | YYYY-MM-DD | No | The date of the last content update (shown at the end of the metadata). |
| `category` | string | No | The primary section category (e.g., Engineering, Notes). Defaults to `Notes`. |
| `tags` | string[] | No | Array of tags representing topics. Defaults to `[]`. |
| `draft` | boolean | No | Set to `true` to hide the post from production builds. Defaults to `false`. |

---

## Typography & Elements

Here is how common markdown structures render with the site's "Keynote" theme:

### Inline Styles
You can use **bold text** for emphasis, *italic text* for quotes or accents, and [inline links](https://example.com) which feature a brass-tinted underline transition. Use `inline code` for filenames, commands, or variable names.

### Lists
- Unordered lists use a simple disc bullet.
- Perfect for bulleted items or checklists.
  - Nested list items are indented.

And ordered lists:
1. First step in a process.
2. Second step.
3. Third step.

### Blockquotes
> "This is a blockquote element. It has a brass accent border on the left side, uses italic text, and is slightly muted to highlight standalone ideas or quotes."

### Tables
Tables are fully responsive and styled with subtle alternating rows:

| Component | Framework | Recommended Use Case |
|---|---|---|
| Astro | Astro | Mostly static, content-heavy websites |
| Next.js | React | Highly interactive, state-heavy SaaS apps |
| Angular | Angular | Large scale enterprise dashboard layouts |

### Code Blocks
Fenced code blocks use a custom background, borders, and horizontal scrolling:

```typescript
// Example TypeScript Code Block
interface BlogPost {
  title: string;
  pubDate: Date;
  updatedDate?: Date;
}

export function formatPostDate(post: BlogPost): string {
  return post.updatedDate 
    ? `Updated: ${post.updatedDate.toDateString()}`
    : `Published: ${post.pubDate.toDateString()}`;
}
```

### Images
Place your post images in a subdirectory co-located with the post markdown file, and reference them relatively:

```markdown
![Image description](./my-image.png)
```
