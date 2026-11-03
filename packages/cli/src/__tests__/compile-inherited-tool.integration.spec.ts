import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { compileCommand } from '../commands/compile.js';

/**
 * One tool directory keeps the agent sources (skills with resources, commands,
 * agents). A workspace inherits them through a symlinked path, extends the
 * tool config and compiles the same builds. The workspace output must be the
 * same as the tool's own output, without a symlink per skill.
 */

const TOOL_CONFIG = `version: '1'
input:
  entry: .promptscript/project.prs
output:
  markers: static
builds:
  factory:
    output: dist/factory
    targets:
      - factory:
          version: full
  claude:
    output: dist/claude
    targets:
      - claude:
          version: full
  system-messages:
    entry: .promptscript/system-messages.prs
    output: dist/system
    targets:
      - claude
`;

const TOOL_PROJECT = `@meta {
  id: "example-tool"
  syntax: "1.4.0"
}

@use ./fragments/review

@identity {
  """
  You maintain the example tool.
  """
}

@skills {
  check-code: {
    description: "Run the code checks"
  }
}
`;

const REVIEW_FRAGMENT = `@meta {
  id: "review"
  syntax: "1.4.0"
}

@skills {
  review-changes: {
    description: "Review the open changes"
  }
}
`;

const WORKSPACE_CONFIG = `extends: tool/promptscript.yaml
builds:
  system-messages:
    enabled: false
`;

const WORKSPACE_PROJECT = `@meta {
  id: "example-tool"
  syntax: "1.4.0"
}

@inherit ../tool/.promptscript/project
`;

const directories: string[] = [];

async function put(directory: string, path: string, content: string): Promise<void> {
  const file = join(directory, path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, content);
}

async function createLayout(): Promise<{ tool: string; workspace: string }> {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'prs-inherited-tool-')));
  directories.push(root);
  const tool = join(root, 'tool-sources');
  const workspace = join(root, 'workspace');

  await put(tool, 'promptscript.yaml', TOOL_CONFIG);
  await put(tool, '.promptscript/project.prs', TOOL_PROJECT);
  await put(tool, '.promptscript/fragments/review.prs', REVIEW_FRAGMENT);
  await put(
    tool,
    '.promptscript/system-messages.prs',
    `@meta {
  id: "example-system"
  syntax: "1.4.0"
}

@identity {
  """
  System messages only the tool builds.
  """
}
`
  );
  await put(
    tool,
    '.promptscript/skills/check-code/SKILL.md',
    `---
name: check-code
description: Run the code checks
---

Run \`scripts/check.py\` and fix what it reports.
`
  );
  await put(tool, '.promptscript/skills/check-code/scripts/check.py', 'print("ok")\n');
  await put(tool, '.promptscript/skills/check-code/templates/report.md', '# Report\n');
  await put(
    tool,
    '.promptscript/skills/review-changes/SKILL.md',
    `---
name: review-changes
description: Review the open changes
---

Read the diff and comment on it.
`
  );
  await put(
    tool,
    '.promptscript/skills/write-notes/SKILL.md',
    `---
name: write-notes
description: Write release notes
---

Write short release notes.
`
  );
  await put(
    tool,
    '.promptscript/commands/ship.md',
    `---
description: Ship the change
---

Ship $ARGUMENTS.
`
  );
  await put(
    tool,
    '.promptscript/agents/helper.md',
    `---
name: helper
description: Helps with small tasks
---

Do the small task.
`
  );

  await put(workspace, 'promptscript.yaml', WORKSPACE_CONFIG);
  // The workspace reaches the tool through a symlinked path.
  await symlink(tool, join(workspace, 'tool'));
  await put(workspace, '.promptscript/project.prs', WORKSPACE_PROJECT);

  return { tool, workspace };
}

async function compile(directory: string): Promise<number | undefined> {
  // Run from the project directory like the CLI does, so markers name the
  // entry file relative to it.
  const originalCwd = process.cwd();
  process.chdir(directory);
  try {
    process.exitCode = undefined;
    await compileCommand({ allBuilds: true });
    const code = process.exitCode;
    process.exitCode = undefined;
    return code as number | undefined;
  } finally {
    process.chdir(originalCwd);
  }
}

/** Every file under `directory`, by relative path. */
async function snapshot(directory: string): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  const walk = async (current: string): Promise<void> => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) await walk(path);
      else files.set(relative(directory, path), await readFile(path, 'utf-8'));
    }
  };
  await walk(directory);
  return files;
}

beforeEach(() => {
  process.exitCode = undefined;
});

afterEach(() => {
  process.exitCode = undefined;
});

afterAll(async () => {
  for (const directory of directories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
});

describe('workspace that inherits a tool project', () => {
  let tool = '';
  let workspace = '';
  let toolExitCode: number | undefined;
  let workspaceExitCode: number | undefined;

  beforeAll(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    ({ tool, workspace } = await createLayout());
    toolExitCode = await compile(tool);
    workspaceExitCode = await compile(workspace);
    vi.restoreAllMocks();
  });

  it('compiles all builds in both projects', () => {
    expect(toolExitCode).toBeUndefined();
    expect(workspaceExitCode).toBeUndefined();
  });

  it.each(['factory', 'claude'])('writes the same %s output as the tool', async (build) => {
    const toolFiles = await snapshot(join(tool, 'dist', build));
    const workspaceFiles = await snapshot(join(workspace, 'dist', build));

    expect([...workspaceFiles.keys()].sort()).toEqual([...toolFiles.keys()].sort());
    for (const [path, content] of toolFiles) {
      expect(workspaceFiles.get(path), path).toBe(content);
    }
  });

  it('writes skill bodies, resources, commands and agents from the tool', async () => {
    const files = await snapshot(join(workspace, 'dist', 'claude'));

    expect(files.get('.claude/skills/check-code/SKILL.md')).toContain('Run `scripts/check.py`');
    expect(files.get('.claude/skills/check-code/scripts/check.py')).toBe('print("ok")\n');
    expect(files.get('.claude/skills/check-code/templates/report.md')).toBe('# Report\n');
    expect(files.get('.claude/skills/review-changes/SKILL.md')).toContain('Read the diff');
    expect(files.get('.claude/skills/write-notes/SKILL.md')).toContain('Write short release');
    expect(files.has('.claude/commands/ship.md')).toBe(true);
    expect(files.has('.claude/agents/helper.md')).toBe(true);
  });

  it('skips the build the workspace turned off', async () => {
    await expect(readdir(join(workspace, 'dist'))).resolves.toEqual(['claude', 'factory']);
  });
});
