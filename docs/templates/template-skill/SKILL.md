---
name: your-skill-name
description: >
  Concise, action-oriented description of what this skill does and when to use it.
  Use when the user asks about [specific triggers, keywords, or workflows].
license: Apache-2.0
compatibility: Requires Python 3.8+ / Node.js 20+
metadata:
  author: "Your Name or Org"
  version: "1.0.0"
  spec-version: "1.0.0"
# allowed-tools: Bash Read
---

<!-- ================================================================
  SKILL.md TEMPLATE — Agent Skills Open Standard
  Spec: https://agentskills.io/specification
  ================================================================

  HOW TO USE THIS TEMPLATE:
  1. Copy this entire folder (template-skill/) to your skills location:
     - Antigravity / Gemini CLI:  .agents/skills/<your-skill-name>/
     - Claude Code:               .claude/skills/<your-skill-name>/
  2. Rename the folder to match the `name` field in the frontmatter above.
  3. Replace all placeholder content below with your skill's instructions.
  4. Delete this HTML comment block before committing.

  FRONTMATTER RULES:
  - `name`        (required) 1-64 chars, lowercase a-z/0-9/hyphens only.
                   Must match the parent directory name.
                   No leading/trailing/consecutive hyphens.
  - `description` (required) 1-1024 chars. Describes WHAT the skill does
                   and WHEN to use it. This is the ONLY text agents read
                   at discovery time — make it count.
  - `license`     (optional) License name or reference to a bundled file.
  - `compatibility` (optional) Max 500 chars. Environment requirements.
  - `metadata`    (optional) Arbitrary key-value pairs (string → string).
  - `allowed-tools` (optional, experimental) Space-separated pre-approved tools.

  BODY GUIDELINES:
  - Keep under 500 lines / ~5000 tokens.
  - Focus on what the agent wouldn't know without this skill.
  - Use procedures (how-to), not declarations (what-to-produce).
  - Provide ONE default tool/approach; mention alternatives briefly.
  - Move detailed reference material to references/ subdirectory.
  ================================================================ -->

# Your Skill Name

Brief one-liner explaining the skill's purpose.

## How It Works

1. **Step 1** — Describe the first action the agent should take.
2. **Step 2** — Describe the next action.
3. **Step 3** — Describe the final action or output.

## Usage

Explain how to invoke or trigger this skill. Include example commands
or scripts if applicable:

```bash
# Example: run the skill's script
python scripts/your-script.py --input <file> --output <result>
```

```powershell
# Windows equivalent
python scripts\your-script.py --input <file> --output <result>
```

## Examples

### Example 1: Basic Usage

**Input:** Describe a sample user request.

**Expected Output:** Describe what the agent should produce.

### Example 2: Edge Case

**Input:** Describe an edge-case scenario.

**Expected Output:** Describe the correct handling.

## Gotchas

<!-- High-value section: environment-specific facts that defy assumptions -->
- **Gotcha 1:** Describe a non-obvious behavior or constraint.
- **Gotcha 2:** Describe another common pitfall.
- **Gotcha 3:** Describe a naming inconsistency or API quirk.

## Validation

After completing the task, verify your work:

1. Run validation: `python scripts/validate.py output/`
2. If validation fails, review errors, fix issues, and re-run.
3. Only proceed when validation passes.

## References

For additional details, see:
- [Reference Guide](references/REFERENCE.md) — Detailed technical reference.
- [API Schema](references/schema.md) — Data schemas and field definitions.
