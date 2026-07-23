# Development Scripts

Cross-platform helpers for local setup, verification, and running the dev server.

**Prerequisites:** Node.js 20+ (CI uses Node 22), npm.

## Windows (PowerShell)

Run from the repository root:

```powershell
.\scripts\win\dev-setup.ps1   # Install deps + astro check (first time / after pull)
.\scripts\win\dev-tests.ps1   # Full pre-publish gate (run before pushing to main)
.\scripts\win\dev-run.ps1     # Dev server → http://localhost:4321
```

If execution policy blocks `.ps1` files:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\win\dev-tests.ps1
```

## Linux / macOS

Make scripts executable once:

```bash
chmod +x scripts/linux/*.sh
```

Then from the repository root:

```bash
./scripts/linux/dev-setup.sh
./scripts/linux/dev-tests.sh
./scripts/linux/dev-run.sh
```

## What `dev-tests` runs

| Step | Command | Purpose |
|:-----|:--------|:--------|
| Type check | `npm run check` | Astro + TypeScript diagnostics |
| Unit tests | `npm run test:unit` | Utility, constant, markdown preview, & Studio FS tests (6 test suites) |
| Integration tests | `npm run test:integration` | Blog content, build output, RSS, AI discoverability, & reader experience tests (7 test suites) |
| Production build | `npm run build` | Same build CI runs on deploy (+ Pagefind index) |

## Publishing

1. Run `dev-tests` — all steps must pass.
2. Commit and push to `main`.
3. GitHub Actions deploys to GitHub Pages automatically.
