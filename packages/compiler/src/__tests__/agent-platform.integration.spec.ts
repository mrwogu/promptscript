import { afterEach, describe, expect, it } from 'vitest';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Compiler } from '../compiler.js';

const directories: string[] = [];

function createDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'promptscript-agent-platform-'));
  directories.push(directory);
  return directory;
}

function requireOutput(result: Awaited<ReturnType<Compiler['compile']>>, path: string): string {
  const output = result.outputs.get(path);
  expect(output, `Missing compiler output: ${path}`).toBeDefined();
  return output!.content;
}

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('Agent platform integration', () => {
  it('compiles platform blocks through parser, resolver, validator, and formatters', async () => {
    const directory = createDirectory();
    const entryPath = join(directory, 'project.prs');
    writeFileSync(
      entryPath,
      `@meta {
  id: "agent-platform-integration"
  syntax: "1.4.0"
}

@identity {
  """
  You are a platform engineering assistant.
  """
}

@skills {
  security-review: {
    description: "Review code security"
    content: "Inspect changes for security risks."
  }
}

@mcpServers {
  issue-tracker: {
    transport: "stdio"
    command: ["node", "./tools/issues.mjs"]
    env: {
      LOG_LEVEL: "info"
    }
  }
}

@agents {
  reviewer: {
    description: "Review pull requests"
    tools: ["Read", "Grep"]
    model: "inherit"
    skills: ["security-review"]
    mcpServers: ["issue-tracker"]
    content: "Review code, tests, and security."
  }
}

@hooks {
  validate-types: {
    event: "post-tool-use"
    matcher: "Edit|Write"
    command: ["pnpm", "run", "typecheck"]
    timeoutMs: 120000
  }
}

@workflows {
  release: {
    description: "Prepare release"
    content: "Run validation and summarize changes."
  }
}

@plugins {
  engineering: {
    description: "Engineering capabilities"
    version: "1.0.0"
    skills: ["security-review"]
    hooks: ["validate-types"]
    mcpServers: ["issue-tracker"]
  }
}
`
    );

    const compiler = new Compiler({
      resolver: { registryPath: directory, projectRoot: directory },
      formatters: [
        { name: 'claude', config: { version: 'full' } },
        { name: 'cursor', config: { version: 'full' } },
        { name: 'factory', config: { version: 'full' } },
      ],
    });

    const result = await compiler.compile(entryPath);

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(requireOutput(result, 'CLAUDE.md')).toContain('platform engineering assistant');
    expect(requireOutput(result, '.claude/skills/security-review/SKILL.md')).toContain(
      'Inspect changes for security risks.'
    );
    const claudeAgent = requireOutput(result, '.claude/agents/reviewer.md');
    expect(claudeAgent).toContain('description: Review pull requests');
    expect(claudeAgent).toContain("tools: ['Read', 'Grep']");
    expect(claudeAgent).toContain('model: inherit');
    expect(claudeAgent).toContain('  - security-review');
    expect(claudeAgent).toContain("mcpServers: ['issue-tracker']");
    expect(requireOutput(result, '.claude/workflows/release.md')).toContain('Prepare release');
    expect(JSON.parse(requireOutput(result, '.claude/settings.json'))).toMatchObject({
      hooks: {
        PostToolUse: [
          {
            matcher: 'Edit|Write',
            hooks: [{ type: 'command', command: 'pnpm run typecheck', timeout: 120 }],
          },
        ],
      },
    });
    expect(JSON.parse(requireOutput(result, '.mcp.json'))).toMatchObject({
      mcpServers: {
        'issue-tracker': {
          type: 'stdio',
          command: ['node', './tools/issues.mjs'],
          env: { LOG_LEVEL: 'info' },
        },
      },
    });

    expect(requireOutput(result, '.cursor/rules/project.mdc')).toContain(
      'platform engineering assistant'
    );
    const cursorAgent = requireOutput(result, '.cursor/agents/reviewer.md');
    expect(cursorAgent).toContain('description: "Review pull requests"');
    expect(cursorAgent).toContain('model: inherit');
    expect(cursorAgent).toContain('mcpServers: ["issue-tracker"]');
    expect(JSON.parse(requireOutput(result, '.cursor/hooks.json'))).toMatchObject({
      postEdit: [
        {
          matcher: 'Edit|Write',
          command: 'pnpm run typecheck',
          timeout: 120,
        },
      ],
    });
    expect(JSON.parse(requireOutput(result, '.cursor/mcp.json'))).toMatchObject({
      mcpServers: {
        'issue-tracker': {
          type: 'stdio',
          command: ['node', './tools/issues.mjs'],
          env: { LOG_LEVEL: 'info' },
        },
      },
    });
    expect(JSON.parse(requireOutput(result, '.cursor/plugins.json'))).toMatchObject({
      plugins: {
        engineering: {
          version: '1.0.0',
          description: 'Engineering capabilities',
          skills: ['security-review'],
          hooks: ['validate-types'],
          mcpServers: ['issue-tracker'],
        },
      },
    });

    expect(requireOutput(result, 'AGENTS.md')).toContain('platform engineering assistant');
    const factoryAgent = requireOutput(result, '.factory/droids/reviewer.md');
    expect(factoryAgent).toContain('description: Review pull requests');
    expect(factoryAgent).toContain('model: inherit');
    expect(factoryAgent).toContain('tools: ["Read", "Grep"]');
    expect(factoryAgent).toContain('mcpServers: ["issue-tracker"]');
    expect(JSON.parse(requireOutput(result, '.factory/settings.json'))).toMatchObject({
      hooks: {
        postToolUse: [
          {
            matcher: 'Edit|Write',
            hooks: [{ type: 'command', command: 'pnpm run typecheck', timeout: 120 }],
          },
        ],
      },
    });
    expect(JSON.parse(requireOutput(result, '.factory/mcp.json'))).toMatchObject({
      mcpServers: {
        'issue-tracker': {
          type: 'stdio',
          command: ['node', './tools/issues.mjs'],
          env: { LOG_LEVEL: 'info' },
        },
      },
    });
    expect(JSON.parse(requireOutput(result, '.factory/plugins.json'))).toMatchObject({
      plugins: {
        engineering: {
          version: '1.0.0',
          description: 'Engineering capabilities',
          skills: ['security-review'],
          hooks: ['validate-types'],
          mcpServers: ['issue-tracker'],
        },
      },
    });
  });

  it('copies native skill references and scripts through the full pipeline', async () => {
    const directory = createDirectory();
    const registryPath = join(directory, 'registry');
    const skillDirectory = join(registryPath, '@skills', 'security-review');
    mkdirSync(join(skillDirectory, 'references'), { recursive: true });
    mkdirSync(join(skillDirectory, 'bin'), { recursive: true });
    writeFileSync(
      join(skillDirectory, 'SKILL.md'),
      `---
name: security-review
description: Review security-sensitive changes
references:
  - references/checklist.md
scripts:
  - bin/check.sh
  - bin/report.sh
---

Review code using the bundled checklist and script.
`
    );
    writeFileSync(join(skillDirectory, 'references', 'checklist.md'), '# Security checklist\n');
    const scriptPath = join(skillDirectory, 'bin', 'check.sh');
    writeFileSync(scriptPath, '#!/bin/sh\necho checking\n');
    chmodSync(scriptPath, 0o755);
    writeFileSync(join(skillDirectory, 'bin', 'report.sh'), '#!/bin/sh\necho report\n');

    const entryPath = join(directory, 'project.prs');
    writeFileSync(
      entryPath,
      `@meta {
  id: "skill-resource-integration"
  syntax: "1.4.0"
}

@skills {
  security-review: {}
}
`
    );

    const compiler = new Compiler({
      resolver: { registryPath, projectRoot: directory },
      formatters: [{ name: 'factory', config: { version: 'full' } }],
    });

    const result = await compiler.compile(entryPath);

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(requireOutput(result, '.factory/skills/security-review/SKILL.md')).toContain(
      'Review code using the bundled checklist and script.'
    );
    expect(
      requireOutput(result, '.factory/skills/security-review/references/checklist.md')
    ).toContain('# Security checklist');
    const emittedScript = result.outputs.get('.factory/skills/security-review/scripts/check.sh');
    expect(emittedScript?.content).toContain('echo checking');
    expect(emittedScript?.mode).toBe(0o755);
    const emittedReport = result.outputs.get('.factory/skills/security-review/scripts/report.sh');
    expect(emittedReport?.content).toContain('echo report');
    expect(emittedReport?.mode).toBe(0o644);
  });
});
