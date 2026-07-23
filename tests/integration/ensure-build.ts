import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const DIST_DIR = path.resolve('dist');
const LOCK_FILE = path.join(DIST_DIR, '.building.lock');

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

  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  let fd: number | null = null;
  try {
    // Atomic file creation: 'wx' flag fails if file exists
    fd = fs.openSync(LOCK_FILE, 'wx');
  } catch (err: any) {
    if (err?.code === 'EEXIST') {
      // Another worker thread acquired lock; wait for it to complete build
      const startTime = Date.now();
      while (fs.existsSync(LOCK_FILE) && Date.now() - startTime < 120_000) {
        try {
          execSync('node -e "setTimeout(() => {}, 300)"');
        } catch {
          // ignore sleep error
        }
      }
      if (isFresh()) return;
    }
  }

  try {
    const astroBin = path.resolve('node_modules', 'astro', 'bin', 'astro.mjs');
    const cleanEnv = { ...process.env };
    delete cleanEnv.NODE_OPTIONS;
    delete cleanEnv.VITEST;
    delete cleanEnv.VITEST_WORKER_ID;

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
