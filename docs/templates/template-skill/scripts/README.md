# Scripts

This directory holds executable code that agents can run during skill execution.

## Guidelines

- Scripts should be **self-contained** or clearly document dependencies.
- Include **helpful error messages** for common failure cases.
- Handle **edge cases** gracefully.
- Supported languages depend on the agent (common: Python, Bash, PowerShell, JavaScript).

## Example Structure

```
scripts/
├── analyze.py       # Input analysis / preprocessing
├── validate.py      # Output validation
├── run.py           # Main execution logic
└── helpers/         # Shared utility modules
    └── utils.py
```
