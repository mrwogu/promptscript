import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Compiler } from '../compiler.js';

const directories: string[] = [];

function createDirectory(prefix: string): string {
  const directory = mkdtempSync(join(tmpdir(), prefix));
  directories.push(directory);
  return directory;
}

function writeSkill(root: string, name: string): void {
  const skillDir = join(root, 'skills', name);
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(
    join(skillDir, 'SKILL.md'),
    `---
name: ${name}
description: Skill fixture for project root isolation
---

Skill body for ${name}.
`
  );
}

function writeEntry(root: string): string {
  const entryPath = join(root, 'project.prs');
  writeFileSync(
    entryPath,
    `@meta {
  id: "project-root-isolation"
  syntax: "1.4.0"
}

@identity {
  role: "Test project"
}
`
  );
  return entryPath;
}

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('project root isolation', () => {
  it('should not discover skills outside the project root', async () => {
    const outside = createDirectory('promptscript-outside-');
    writeSkill(outside, 'leaked-skill');
    const project = createDirectory('promptscript-project-');
    const entryPath = writeEntry(project);

    const originalCwd = process.cwd();
    process.chdir(outside);
    try {
      const compiler = new Compiler({
        resolver: { registryPath: project, projectRoot: project },
        formatters: [{ name: 'claude', config: { version: 'full' } }],
      });

      const result = await compiler.compile(entryPath);

      expect(result.success).toBe(true);
      expect([...result.outputs.keys()]).not.toContain('.claude/skills/leaked-skill/SKILL.md');
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should infer the project root from the entry path when none is configured', async () => {
    const outside = createDirectory('promptscript-outside-');
    writeSkill(outside, 'cwd-skill');
    const project = createDirectory('promptscript-project-');
    writeSkill(project, 'entry-skill');
    const entryPath = writeEntry(project);

    const originalCwd = process.cwd();
    process.chdir(outside);
    try {
      const compiler = new Compiler({
        resolver: { registryPath: project },
        formatters: [{ name: 'claude', config: { version: 'full' } }],
      });

      const result = await compiler.compile(entryPath);

      expect(result.success).toBe(true);
      const outputs = [...result.outputs.keys()];
      expect(outputs).toContain('.claude/skills/entry-skill/SKILL.md');
      expect(outputs).not.toContain('.claude/skills/cwd-skill/SKILL.md');
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should discover skills inside the project root without an explicit local path', async () => {
    const outside = createDirectory('promptscript-outside-');
    const project = createDirectory('promptscript-project-');
    writeSkill(project, 'owned-skill');
    const entryPath = writeEntry(project);

    const originalCwd = process.cwd();
    process.chdir(outside);
    try {
      const compiler = new Compiler({
        resolver: { registryPath: project, projectRoot: project },
        formatters: [{ name: 'claude', config: { version: 'full' } }],
      });

      const result = await compiler.compile(entryPath);

      expect(result.success).toBe(true);
      expect([...result.outputs.keys()]).toContain('.claude/skills/owned-skill/SKILL.md');
    } finally {
      process.chdir(originalCwd);
    }
  });
});
