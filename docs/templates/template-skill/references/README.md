# References

This directory holds additional documentation that agents can read **on demand**.

Files here are NOT loaded at activation time — only when the skill's
instructions explicitly tell the agent to consult them.

## Guidelines

- Keep individual files focused and concise.
- Name files descriptively: `api-errors.md`, `schema.md`, `troubleshooting.md`.
- In your `SKILL.md`, tell the agent **when** to load each file:
  - ✅ `"Read references/api-errors.md if the API returns a non-200 status code"`
  - ❌ `"See references/ for details"` (too vague — agent won't know when to look)

## Example Files

- `REFERENCE.md` — Detailed technical reference
- `schema.md` — Data schemas and field definitions
- `api-errors.md` — Error codes and recovery procedures
