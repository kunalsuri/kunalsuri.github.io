import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

describe('publish-draft.py CLI tool', () => {
  const SCRIPT_PATH = path.resolve(process.cwd(), 'scripts/publish-draft.py');

  it('runs --help without error', async () => {
    const { stdout } = await execFileAsync('python', [SCRIPT_PATH, '--help']);
    expect(stdout).toContain('Publish blog drafts from docs/drafts/');
    expect(stdout).toContain('--keep-draft');
    expect(stdout).toContain('--today');
    expect(stdout).toContain('--dry-run');
  });

  it('lists existing drafts with --list', async () => {
    const { stdout } = await execFileAsync('python', [SCRIPT_PATH, '--list']);
    expect(stdout).toContain('Available Drafts');
    expect(stdout).toContain('2026-09-02-understanding-agent-stack');
  });

  it('executes a dry-run move without changing disk', async () => {
    const { stdout } = await execFileAsync('python', [
      SCRIPT_PATH,
      '2026-09-02-understanding-agent-stack',
      '--dry-run',
    ]);
    expect(stdout).toContain('Processing: 2026-09-02-understanding-agent-stack');
    expect(stdout).toContain('[Dry Run] No filesystem modifications made.');
  });

  it('normalizes target slugs to lowercase URL-safe format', async () => {
    const { stdout } = await execFileAsync('python', [
      SCRIPT_PATH,
      '2026-02-08-SaaSpocalypse',
      '--dry-run',
    ]);
    expect(stdout).toContain('Target Slug: 2026-02-08-saaspocalypse');
  });
});

describe('publish-draft Agent Skill standard conformance', () => {
  const SKILL_ROOTS = [
    path.resolve(process.cwd(), '.agents/skills/publish-draft'),
    path.resolve(process.cwd(), '.claude/skills/publish-draft'),
  ];

  for (const skillDir of SKILL_ROOTS) {
    const label = path.basename(path.dirname(path.dirname(skillDir)));

    it(`validates ${label} skill directory structure and metadata`, () => {
      expect(fs.existsSync(path.join(skillDir, 'SKILL.md'))).toBe(true);
      expect(fs.existsSync(path.join(skillDir, 'metadata.json'))).toBe(true);
      expect(fs.existsSync(path.join(skillDir, 'scripts/publish_draft.py'))).toBe(true);
      expect(fs.existsSync(path.join(skillDir, 'references/REFERENCE.md'))).toBe(true);

      const meta = JSON.parse(fs.readFileSync(path.join(skillDir, 'metadata.json'), 'utf-8'));
      expect(meta.name).toBe('publish-draft');
      expect(meta.specVersion).toBe('1.0.0');
      expect(meta.validationRules.nameLengthMax).toBe(64);
    });

    it(`validates ${label} SKILL.md frontmatter constraints`, () => {
      const skillMd = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf-8');
      expect(skillMd).toMatch(/^---\r?\nname:\s*publish-draft/);
      expect(skillMd).toContain('license: Apache-2.0');
      expect(skillMd).toContain('compatibility:');
      expect(skillMd).toContain('## Gotchas');
      expect(skillMd).toContain('## References');
    });
  }
});

