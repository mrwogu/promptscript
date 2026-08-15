import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { Lockfile } from '@promptscript/core';
import {
  VENDOR_GIT_DIR,
  VENDOR_MANIFEST_FILE,
  getVendorRepositoryRelativePath,
  hashContent,
  hashVendorRepository,
} from '@promptscript/resolver';
import { Compiler } from '../compiler.js';

const directories: string[] = [];
const execFileAsync = promisify(execFile);

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
    mkdirSync(join(project, '.promptscript'));
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

  it('should walk from an entry directory to a project marker for imports', async () => {
    const project = createDirectory('promptscript-marked-project-');
    writeFileSync(join(project, 'package.json'), '{}');
    mkdirSync(join(project, 'tools'), { recursive: true });
    mkdirSync(join(project, 'shared'), { recursive: true });
    writeFileSync(
      join(project, 'shared', 'x.prs'),
      `@identity {
  role: "Shared"
}
`
    );
    const entryPath = join(project, 'tools', 'main.prs');
    writeFileSync(
      entryPath,
      `@meta {
  id: "marked-import"
  syntax: "1.4.0"
}

@use ../shared/x

@identity {
  role: "Main"
}
`
    );

    const compiler = new Compiler({
      resolver: { registryPath: project },
      formatters: [],
    });

    const result = await compiler.compile(entryPath);

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should keep cwd resolution for entries with no project marker', async () => {
    const project = createDirectory('promptscript-unmarked-project-');
    const realProject = realpathSync(project);
    mkdirSync(join(realProject, 'tools'), { recursive: true });
    mkdirSync(join(realProject, 'shared'), { recursive: true });
    writeFileSync(
      join(realProject, 'shared', 'x.prs'),
      `@identity {
  role: "Shared"
}
`
    );
    const entryPath = join(realProject, 'tools', 'main.prs');
    writeFileSync(
      entryPath,
      `@meta {
  id: "unmarked-import"
  syntax: "1.4.0"
}

@use ../shared/x

@identity {
  role: "Main"
}
`
    );

    const originalCwd = process.cwd();
    process.chdir(project);
    try {
      const compiler = new Compiler({
        resolver: { registryPath: project },
        formatters: [],
      });

      const result = await compiler.compile(entryPath);

      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should verify vendored reference hashes with an entry-scoped resolver', async () => {
    const project = createDirectory('promptscript-vendor-project-');
    mkdirSync(join(project, '.promptscript'));
    const vendorDir = createDirectory('promptscript-vendor-');
    const repoUrl = 'https://github.com/acme/vendor';
    const version = 'v1.0.0';
    const repositoryPath = join(vendorDir, getVendorRepositoryRelativePath(repoUrl));
    mkdirSync(repositoryPath, { recursive: true });
    const referenceContent = 'vendored reference\n';
    writeFileSync(join(repositoryPath, 'reference.md'), referenceContent);

    await execFileAsync('git', ['init', '--quiet', repositoryPath]);
    await execFileAsync('git', ['-C', repositoryPath, 'add', '.']);
    await execFileAsync(
      'git',
      [
        '-C',
        repositoryPath,
        '-c',
        'user.name=PromptScript Test',
        '-c',
        'user.email=test@example.com',
        'commit',
        '--quiet',
        '-m',
        'vendor',
      ],
      {
        env: {
          ...process.env,
          GIT_CONFIG_GLOBAL: '/dev/null',
          GIT_CONFIG_NOSYSTEM: '1',
        },
      }
    );
    const { stdout } = await execFileAsync('git', ['-C', repositoryPath, 'rev-parse', 'HEAD']);
    const commit = stdout.trim();
    renameSync(join(repositoryPath, '.git'), join(repositoryPath, VENDOR_GIT_DIR));
    const integrity = await hashVendorRepository(repositoryPath);
    writeFileSync(
      join(vendorDir, VENDOR_MANIFEST_FILE),
      JSON.stringify({
        version: 1,
        dependencies: {
          [repoUrl]: {
            commit,
            integrity,
            path: getVendorRepositoryRelativePath(repoUrl),
            version,
          },
        },
      })
    );

    const lockfile: Lockfile = {
      version: 1,
      dependencies: {
        [repoUrl]: { version, commit, integrity },
      },
      references: {
        [`${repoUrl}\0reference.md\0${version}`]: {
          hash: hashContent(Buffer.from(referenceContent)),
          lockedAt: '2026-01-01T00:00:00Z',
        },
      },
    };
    const entryPath = join(project, 'project.prs');
    writeFileSync(entryPath, '@meta { id: "vendor-project" syntax: "1.4.0" }\n');

    const compiler = new Compiler({
      resolver: {
        registryPath: project,
        vendorDir,
        lockfile,
      },
      formatters: [],
    });

    const result = await compiler.compile(entryPath);

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
  });
});
