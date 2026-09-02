# Agent Skills Knowledge Base & Templates

> Canonical templates and specification reference for creating and maintaining **Agent Skills** across Antigravity, Claude Code, and GitHub Copilot.
> Based on the **Agent Skills Open Standard** ([agentskills.io](https://agentskills.io/)).

---

## 📋 Knowledge Base Metadata

| Property | Value | Description |
|---|---|---|
| **Standard** | [Agent Skills Open Standard](https://agentskills.io/) | Multi-agent skill format specification |
| **Spec Version** | `1.0.0` | Official spec version |
| **Last Synced** | `2026-09-02` | Date of last upstream documentation synchronization |
| **Quickstart Reference** | [agentskills.io/skill-creation/quickstart](https://agentskills.io/skill-creation/quickstart) | First-party quickstart guide |
| **Full Specification** | [agentskills.io/specification](https://agentskills.io/specification) | Schema and constraints reference |
| **Best Practices** | [agentskills.io/skill-creation/best-practices](https://agentskills.io/skill-creation/best-practices) | Authoring & progressive disclosure guide |
| **Script Guidelines** | [agentskills.io/skill-creation/using-scripts](https://agentskills.io/skill-creation/using-scripts) | Bundled deterministic scripts pattern |
| **Status** | `CURRENT` | Validated against active tooling |

---

## 🗂️ Templates Inventory

- **[template-skill/](file:///c:/Users/ks248120/Documents/GitHub/kunalsuri.github.io/docs/templates/template-skill/)** — Complete starter folder for a production-ready Agent Skill:
  - [`SKILL.md`](file:///c:/Users/ks248120/Documents/GitHub/kunalsuri.github.io/docs/templates/template-skill/SKILL.md): Standard YAML frontmatter + structured body (How It Works, Usage, Examples, Gotchas, Validation).
  - [`metadata.json`](file:///c:/Users/ks248120/Documents/GitHub/kunalsuri.github.io/docs/templates/template-skill/metadata.json): Upstream spec linkage, validation rules, and client compatibility data.
  - [`SKILL-REFERENCE-GUIDE.md`](file:///c:/Users/ks248120/Documents/GitHub/kunalsuri.github.io/docs/templates/template-skill/SKILL-REFERENCE-GUIDE.md): In-depth 350-line field-by-field reference guide.
  - `scripts/`: Directory for deterministic Python / Bash scripts.
  - `references/`: On-demand detailed documentation and schemas.
  - `assets/`: Static templates, examples, and lookup tables.

- **[anthropic-skill-creator/](file:///c:/Users/ks248120/Documents/GitHub/kunalsuri.github.io/docs/templates/anthropic-skill-creator/)** — Iterative evaluation and benchmark harness for refining skill descriptions and assertions.

---

## ⚡ How to Create a New Skill from this Knowledge Base

### 1. Copy the Starter Template
```bash
# For Antigravity / Gemini CLI / VS Code Copilot:
cp -r docs/templates/template-skill/ .agents/skills/<your-skill-name>/

# For Claude Code:
cp -r docs/templates/template-skill/ .claude/skills/<your-skill-name>/
```

### 2. Configure `SKILL.md` Frontmatter
Frontmatter must follow these strict validation rules:

```yaml
---
name: your-skill-name
description: >
  Extracts text, fills forms, and merges files. Use when working with
  PDF documents or when the user mentions PDFs, forms, or document extraction.
license: Apache-2.0
compatibility: Requires Python 3.8+
metadata:
  author: "Your Name"
  version: "1.0.0"
# allowed-tools: Bash Read
---
```

#### Field Rules:
- **`name`** *(Required)*: `1-64` characters, lowercase alphanumeric (`a-z`, `0-9`) and hyphens (`-`). Must match the parent directory name. No leading/trailing/consecutive hyphens.
- **`description`** *(Required)*: `1-1024` characters. Must describe **what** the skill does AND **when to use it** (specific keywords/triggers to prevent undertriggering).
- **`license`** *(Optional)*: License identifier (e.g. `Apache-2.0` or `MIT`).
- **`compatibility`** *(Optional)*: `1-500` characters. Environment/tooling prerequisites.
- **`metadata`** *(Optional)*: Key-value string map for versioning, authors, or links.

### 3. Implement Progressive Disclosure Body
1. **Level 1 (Metadata ~100 tokens)**: `name` and `description` are loaded at session startup so the agent knows when to activate the skill.
2. **Level 2 (Instructions <500 lines)**: `SKILL.md` body is loaded only when the skill activates.
3. **Level 3 (Resources as needed)**: Bundled files in `scripts/`, `references/`, and `assets/` are loaded or executed only on demand.

---

## 🔄 How to Keep this Knowledge Base Current

When the Agent Skills standard evolves:
1. Check the official specification changelog at [agentskills.io/specification](https://agentskills.io/specification) or the [Agent Skills GitHub repository](https://github.com/agentskills/agentskills).
2. Update `docs/templates/template-skill/metadata.json` with the new `lastSynced` date and spec version.
3. Update `docs/templates/template-skill/SKILL-REFERENCE-GUIDE.md` and `docs/templates/README.md` with any new frontmatter fields or behavioral changes.
4. Audit active skills in `.agents/skills/` and `.claude/skills/` to ensure they conform to updated validation rules.
