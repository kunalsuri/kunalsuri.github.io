import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const DIST_DIR = path.resolve('dist');
// The lock deliberately lives OUTSIDE dist/. `astro build` empties dist/ as it
// starts, so a lock kept in there is deleted by the very build it guards —
// every waiting worker then sees no lock and no fresh dist, and they all build
// on top of each other. node_modules/.cache is already gitignored and is not
// touched by the build.
const LOCK_DIR = path.resolve('node_modules', '.cache');
const LOCK_FILE = path.join(LOCK_DIR, 'astro-integration-build.lock');
const LOCK_STALE_MS = 180_000;

/**
 * Ensures `dist/` is built and up-to-date before running integration tests.
 * Uses atomic file locking ('wx' flag) to guarantee that only ONE worker thread
 * executes `astro build` when tests run concurrently in Vitest.
 */
export function ensureDistBuilt(): void {
  const indexPath = path.join(DIST_DIR, 'index.html');
  const srcDir = path.resolve('src');

  const isFresh = (): boolean => {
    if (!fs.existsSync(indexPath)) return false;
    const distMtime = fs.statSync(indexPath).mtimeMs;

    const checkFreshness = (dir: string): boolean => {
      if (!fs.existsSync(dir)) return true;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!checkFreshness(fullPath)) return false;
        } else if (fs.statSync(fullPath).mtimeMs > distMtime) {
          return false;
        }
      }
      return true;
    };
    return checkFreshness(srcDir);
  };

  if (isFresh()) return;

  fs.mkdirSync(LOCK_DIR, { recursive: true });

  // A lock left behind by a crashed run would block every future test run, so
  // one older than a build could plausibly take is treated as abandoned.
  try {
    const age = Date.now() - fs.statSync(LOCK_FILE).mtimeMs;
    if (age > LOCK_STALE_MS) fs.unlinkSync(LOCK_FILE);
  } catch {
    // No lock file, or it vanished under us — either way, nothing to clear.
  }

  let fd: number | null = null;
  try {
    // Atomic file creation: 'wx' fails if the file already exists.
    fd = fs.openSync(LOCK_FILE, 'wx');
  } catch (err: any) {
    if (err?.code === 'EEXIST') {
      // Another worker holds the lock. Wait for it to finish and use its build
      // rather than racing it.
      const startTime = Date.now();
      while (fs.existsSync(LOCK_FILE) && Date.now() - startTime < LOCK_STALE_MS) {
        try {
          execSync('node -e "setTimeout(() => {}, 300)"');
        } catch {
          // ignore sleep error
        }
      }
      if (isFresh()) return;
      // The holder finished but produced nothing usable (it crashed, or the
      // wait timed out). Fall through and build here instead of asserting
      // against a dist/ that may be half-written.
    }
  }

  try {
    const astroBin = path.resolve('node_modules', 'astro', 'bin', 'astro.mjs');
    // Vitest exports its own Vite environment into process.env — MODE=test,
    // DEV=1, PROD= (empty, therefore falsy), SSR=1, BASE_URL, TEST — alongside
    // NODE_ENV=test. A child `astro build` inherits them and Vite honours them
    // over its own defaults, so `import.meta.env.PROD` comes out false: draft
    // posts get built, and the integration tests below then assert against a
    // bundle that is not the one deployed. Stripping them lets Astro resolve
    // its normal production defaults.
    const cleanEnv = { ...process.env };
    for (const key of [
      'NODE_OPTIONS',
      'NODE_ENV',
      'VITEST',
      'VITEST_WORKER_ID',
      'VITEST_POOL_ID',
      'VITEST_MODE',
      'MODE',
      'DEV',
      'PROD',
      'SSR',
      'BASE_URL',
      'TEST',
      'FORCE_TTY',
    ]) {
      delete cleanEnv[key];
    }

    execSync(`"${process.execPath}" "${astroBin}" build`, {
      cwd: path.resolve('.'),
      env: cleanEnv,
      stdio: 'pipe',
      timeout: 120_000,
    });
  } finally {
    if (fd !== null) {
      try {
        fs.closeSync(fd);
      } catch {
        // ignore close error
      }
    }
    if (fs.existsSync(LOCK_FILE)) {
      try {
        fs.unlinkSync(LOCK_FILE);
      } catch {
        // ignore unlink error
      }
    }
  }
}
