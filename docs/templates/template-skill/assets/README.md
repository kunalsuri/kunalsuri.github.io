# Assets

This directory holds static resources for the skill.

## What Goes Here

- **Templates** — Document templates, configuration file templates
- **Images** — Diagrams, example screenshots
- **Data files** — Lookup tables, schemas, sample data

## Guidelines

- Assets are loaded on demand, not at activation time.
- Reference assets from your `SKILL.md` using relative paths:
  ```markdown
  Use the template in [assets/report-template.md](assets/report-template.md).
  ```
