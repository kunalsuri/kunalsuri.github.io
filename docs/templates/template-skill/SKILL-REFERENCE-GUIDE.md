# Agent Skills — SKILL.md Reference Guide

> Complete reference for creating Agent Skills following the [Agent Skills Open Standard](https://agentskills.io).
> Source specification: [agentskills.io/specification](https://agentskills.io/specification)

---

## Table of Contents

- [Overview](#overview)
- [Directory Structure](#directory-structure)
- [SKILL.md Format](#skillmd-format)
  - [Frontmatter Fields](#frontmatter-fields)
  - [Body Content](#body-content)
- [Progressive Disclosure](#progressive-disclosure)
- [Best Practices](#best-practices)
- [Writing Effective Descriptions](#writing-effective-descriptions)
- [Instruction Patterns](#instruction-patterns)
- [Where to Place Skills](#where-to-place-skills)
- [Quick Reference Table](#quick-reference-table)

---

## Overview

**Agent Skills** is an open standard for packaging domain-specific knowledge and workflows that AI coding agents can discover and load dynamically. Skills are portable across compatible agents including **GitHub Copilot (VS Code)**, **Claude Code**, **Gemini CLI / Antigravity**, **OpenAI Codex**, and others.

Each skill is a **folder** containing at minimum a `SKILL.md` file — a Markdown document with YAML frontmatter that describes what the skill does and instructions for the agent to follow.

---

## Directory Structure

```
your-skill-name/
├── SKILL.md          # Required: YAML frontmatter + instructions
├── scripts/          # Optional: executable code (Python, Bash, JS)
├── references/       # Optional: additional documentation loaded on-demand
├── assets/           # Optional: templates, resources, static files
└── ...               # Any additional files or directories
```

| Directory      | Purpose | When Loaded |
|:-------------- |:------- |:----------- |
| `SKILL.md`     | Core metadata + instructions | On activation |
| `scripts/`     | Executable code the agent can run | On demand during execution |
| `references/`  | Detailed docs, schemas, specs | On demand when referenced |
| `assets/`      | Templates, images, data files | On demand when referenced |

---

## SKILL.md Format

The `SKILL.md` file consists of two parts:
1. **YAML Frontmatter** (between `---` markers)
2. **Markdown Body** (instructions)

### Frontmatter Fields

| Field           | Required | Constraints | Description |
|:--------------- |:-------- |:----------- |:----------- |
| `name`          | **Yes**  | 1-64 chars, lowercase `a-z`, `0-9`, hyphens (`-`) only. No leading/trailing/consecutive hyphens. Must match parent directory name. | Unique identifier for the skill |
| `description`   | **Yes**  | 1-1024 chars, non-empty | Describes what the skill does AND when to use it. This is the primary mechanism agents use to decide activation. |
| `license`       | No       | Short string | License name or reference to bundled license file |
| `compatibility` | No       | Max 500 chars | Environment requirements (products, packages, network, etc.) |
| `metadata`      | No       | Map of string → string | Arbitrary key-value pairs for custom metadata |
| `allowed-tools` | No       | Space-separated string | Pre-approved tools the skill may use (experimental) |

#### `name` Field Rules

**Valid:**
```yaml
name: pdf-processing
name: data-analysis
name: code-review
name: my-skill-v2
```

**Invalid:**
```yaml
name: PDF-Processing    # uppercase not allowed
name: -pdf              # cannot start with hyphen
name: pdf-              # cannot end with hyphen
name: pdf--processing   # consecutive hyphens not allowed
name: my skill          # spaces not allowed
```

#### `description` Field — Good vs Poor

```yaml
# ✅ Good — specific, includes triggers and scope
description: >
  Analyze CSV and tabular data files — compute summary statistics,
  add derived columns, generate charts, and clean messy data. Use this
  skill when the user has a CSV, TSV, or Excel file and wants to
  explore, transform, or visualize the data, even if they don't
  explicitly mention "CSV" or "analysis."

# ❌ Poor — too vague, agent can't determine when to use it
description: Helps with data files.
```

#### Minimal Example

```yaml
---
name: skill-name
description: A description of what this skill does and when to use it.
---
```

#### Full Example

```yaml
---
name: pdf-processing
description: >
  Extract PDF text, fill forms, merge files. Use when handling PDFs,
  extracting text from documents, or when the user mentions PDFs,
  forms, or document extraction.
license: Apache-2.0
compatibility: Requires Python 3.12+ and pdfplumber
metadata:
  author: example-org
  version: "1.0"
allowed-tools: Bash(python:*) Read
---
```

### Body Content

The Markdown body after the frontmatter contains the skill instructions. There are **no format restrictions** — write whatever helps agents perform the task effectively.

**Recommended sections:**

1. **How It Works** — Step-by-step numbered workflow
2. **Usage** — Commands, scripts, or invocation patterns
3. **Examples** — Concrete input/output scenarios
4. **Gotchas** — Environment-specific facts that defy assumptions
5. **Validation** — How to verify the output
6. **References** — Links to files in `references/` directory

---

## Progressive Disclosure

Skills use a **3-tier loading model** to minimize token usage:

```
┌─────────────────────────────────────────────────────────┐
│ Tier 1: DISCOVERY (~100 tokens)                         │
│ Agent reads only `name` + `description` at startup      │
│ for ALL installed skills                                 │
├─────────────────────────────────────────────────────────┤
│ Tier 2: ACTIVATION (<5000 tokens recommended)           │
│ When a task matches, agent loads the full SKILL.md body │
├─────────────────────────────────────────────────────────┤
│ Tier 3: EXECUTION (as needed)                           │
│ Agent loads scripts/, references/, assets/ on demand    │
└─────────────────────────────────────────────────────────┘
```

**Key guidelines:**
- Keep `SKILL.md` **under 500 lines** and **~5000 tokens**
- Move detailed reference material to separate files in `references/`
- Tell the agent *when* to load each reference file:
  - ✅ `"Read references/api-errors.md if the API returns a non-200 status code"`
  - ❌ `"See references/ for details"` (too vague)

---

## Best Practices

### 1. Start from Real Expertise

Don't ask an LLM to generate a skill without domain context. Instead:
- **Extract from a hands-on task** — Complete a real task, then distill the reusable pattern
- **Synthesize from project artifacts** — Use internal docs, runbooks, schemas, code reviews

### 2. Add What the Agent Lacks, Omit What It Knows

Focus on project-specific conventions, domain-specific procedures, non-obvious edge cases, and particular tools/APIs. Don't explain general knowledge.

```markdown
<!-- ❌ Too verbose — agent already knows what PDFs are -->
PDF (Portable Document Format) files are a common file format...

<!-- ✅ Better — jumps to what the agent wouldn't know -->
Use pdfplumber for text extraction. For scanned documents,
fall back to pdf2image with pytesseract.
```

### 3. Design Coherent Units

- **Too narrow** → multiple skills load for one task, risking conflicts
- **Too broad** → hard to activate precisely
- **Just right** → encapsulates a coherent unit of work (like a well-scoped function)

### 4. Provide Defaults, Not Menus

```markdown
<!-- ❌ Too many options -->
You can use pypdf, pdfplumber, PyMuPDF, or pdf2image...

<!-- ✅ Clear default with escape hatch -->
Use pdfplumber for text extraction.
For scanned PDFs requiring OCR, use pdf2image with pytesseract instead.
```

### 5. Favor Procedures Over Declarations

```markdown
<!-- ❌ Specific answer — only useful for this exact task -->
Join the `orders` table to `customers` on `customer_id`...

<!-- ✅ Reusable method — works for any query -->
1. Read the schema from `references/schema.yaml` to find relevant tables
2. Join tables using the `_id` foreign key convention
3. Apply filters from the user's request as WHERE clauses
```

### 6. Refine with Real Execution

Run the skill against real tasks, review execution traces, and iterate. Even one pass of execute-then-revise noticeably improves quality.

---

## Writing Effective Descriptions

The `description` carries the **entire burden of triggering**. Principles:

| Principle | Guidance |
|:--------- |:-------- |
| **Use imperative phrasing** | "Use when..." rather than "This skill does..." |
| **Focus on user intent** | Describe what the user is trying to achieve, not internals |
| **Be pushy** | Explicitly list contexts: "even if they don't mention 'CSV'" |
| **Keep it concise** | A few sentences, under 1024 characters |
| **Include specific keywords** | Terms users would naturally use in their requests |

### Testing Descriptions

Create ~20 eval queries (10 should-trigger, 10 should-not-trigger) and test:
- Vary phrasing, explicitness, detail level, and complexity
- For negatives, use **near-misses** (shared keywords, different intent)
- Run multiple times (3+) to account for nondeterminism
- Compute trigger rates and iterate

---

## Instruction Patterns

### Gotchas Sections
```markdown
## Gotchas
- The `users` table uses soft deletes. Always include `WHERE deleted_at IS NULL`.
- User ID is `user_id` in DB, `uid` in auth, `accountId` in billing. Same value.
- `/health` returns 200 even if DB is down. Use `/ready` for full health check.
```

### Output Templates
````markdown
## Report Structure
Use this template:

```markdown
# [Analysis Title]

## Executive Summary
[One-paragraph overview]

## Key Findings
- Finding 1 with supporting data

## Recommendations
1. Specific actionable recommendation
```
````

### Checklists
```markdown
## Workflow
- [ ] Step 1: Analyze input (`scripts/analyze.py`)
- [ ] Step 2: Create mapping (`fields.json`)
- [ ] Step 3: Validate (`scripts/validate.py`)
- [ ] Step 4: Execute (`scripts/run.py`)
- [ ] Step 5: Verify output (`scripts/verify.py`)
```

### Validation Loops
```markdown
## Validation
1. Make your edits
2. Run: `python scripts/validate.py output/`
3. If fails → review, fix, re-run
4. Only proceed when validation passes
```

---

## Where to Place Skills

| Agent / Tool | Skills Location | Notes |
|:------------ |:--------------- |:----- |
| **Antigravity / Gemini CLI** | `.agents/skills/<skill-name>/` | Auto-discovered |
| **Claude Code** | `.claude/skills/<skill-name>/` | Auto-discovered |
| **GitHub Copilot (VS Code)** | `.agents/skills/<skill-name>/` | Auto-discovered |
| **Global (user-level)** | `~/.gemini/config/skills/<skill-name>/` (Gemini) | Available across all projects |

### Registration (`skills.json`)

For skills in non-standard locations, create a `skills.json`:

```json
{
  "entries": [
    { "path": "path/to/custom/skills" }
  ],
  "inherits": [
    { "path": "path/to/shared/skills.json" }
  ],
  "exclude": ["some_skill_to_ignore"]
}
```

---

## Quick Reference Table

| What | Rule |
|:---- |:---- |
| Required files | `SKILL.md` (minimum) |
| Name constraints | 1-64 chars, lowercase, hyphens, match directory |
| Description limit | 1-1024 characters |
| Body length | < 500 lines / ~5000 tokens |
| File references | Relative paths from skill root, 1 level deep |
| Loading model | Progressive: metadata → body → resources |
| Portability | Cross-agent: Copilot, Claude, Gemini, Codex |
| Validation tool | `skills-ref validate ./my-skill` |

---

## Sources

- [Agent Skills Specification](https://agentskills.io/specification) — Complete format reference
- [Quickstart Guide](https://agentskills.io/skill-creation/quickstart) — Create your first skill
- [Best Practices](https://agentskills.io/skill-creation/best-practices) — Writing effective skills
- [Optimizing Descriptions](https://agentskills.io/skill-creation/optimizing-descriptions) — Improve trigger accuracy
- [GitHub: agentskills/agentskills](https://github.com/agentskills/agentskills) — Official repository
- [GitHub: anthropics/skills](https://github.com/anthropics/skills) — Example skills
