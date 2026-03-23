import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm, symlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { resolveNativeAgents } from '../skills.js';
import type { Program, ObjectContent, TextContent } from '@promptscript/core';

function emptyAst(sourceFile: string): Program {
  return {
    type: 'Program',
    meta: {
      type: 'MetaBlock',
      fields: { id: 'test', syntax: '1.1.0' },
      loc: { file: sourceFile, line: 1, column: 1, offset: 0 },
    },
    blocks: [],
    uses: [],
    extends: [],
    loc: { file: sourceFile, line: 1, column: 1, offset: 0 },
  };
}

describe('resolveNativeAgents', () => {
  let tempDir: string;
  let localPath: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'prs-agent-test-'));
    localPath = join(tempDir, '.promptscript');
    await mkdir(localPath, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should return unchanged AST when no agents directory exists', async () => {
    const ast = emptyAst(join(localPath, 'project.prs'));
    const result = await resolveNativeAgents(ast, ast.loc.file, localPath);
    expect(result).toBe(ast);
  });

  it('should discover agents from local .promptscript/agents/ directory', async () => {
    const agentsDir = join(localPath, 'agents');
    await mkdir(agentsDir, { recursive: true });
    await writeFile(
      join(agentsDir, 'planner.md'),
      `---
name: planner
description: Expert planning specialist
tools: ["Read", "Grep", "Glob"]
model: opus
---

You are an expert planning specialist.`
    );

    const ast = emptyAst(join(localPath, 'project.prs'));
    const result = await resolveNativeAgents(ast, ast.loc.file, localPath);

    // Should have created an @agents block
    const agentsBlock = result.blocks.find((b) => b.name === 'agents');
    expect(agentsBlock).toBeDefined();

    const props = (agentsBlock!.content as ObjectContent).properties;
    expect(props['planner']).toBeDefined();

    const planner = props['planner'] as Record<string, unknown>;
    expect(planner['description']).toBe('Expert planning specialist');
    expect(planner['tools']).toEqual(['Read', 'Grep', 'Glob']);
    expect(planner['model']).toBe('opus');
    expect((planner['content'] as TextContent).value).toContain(
      'You are an expert planning specialist.'
    );
  });

  it('should discover multiple agents', async () => {
    const agentsDir = join(localPath, 'agents');
    await mkdir(agentsDir, { recursive: true });

    await writeFile(
      join(agentsDir, 'planner.md'),
      '---\nname: planner\ndescription: Plans things\n---\nPlan content.'
    );
    await writeFile(
      join(agentsDir, 'reviewer.md'),
      '---\nname: reviewer\ndescription: Reviews code\n---\nReview content.'
    );

    const ast = emptyAst(join(localPath, 'project.prs'));
    const result = await resolveNativeAgents(ast, ast.loc.file, localPath);

    const agentsBlock = result.blocks.find((b) => b.name === 'agents');
    const props = (agentsBlock!.content as ObjectContent).properties;
    expect(Object.keys(props)).toContain('planner');
    expect(Object.keys(props)).toContain('reviewer');
  });

  it('should skip files without frontmatter', async () => {
    const agentsDir = join(localPath, 'agents');
    await mkdir(agentsDir, { recursive: true });
    await writeFile(join(agentsDir, 'nofront.md'), 'Just some markdown.');

    const ast = emptyAst(join(localPath, 'project.prs'));
    const result = await resolveNativeAgents(ast, ast.loc.file, localPath);
    expect(result).toBe(ast); // No agents discovered
  });

  it('should skip files without description', async () => {
    const agentsDir = join(localPath, 'agents');
    await mkdir(agentsDir, { recursive: true });
    await writeFile(join(agentsDir, 'nodesc.md'), '---\nname: nodesc\n---\nContent.');

    const ast = emptyAst(join(localPath, 'project.prs'));
    const result = await resolveNativeAgents(ast, ast.loc.file, localPath);
    expect(result).toBe(ast);
  });

  it('should not overwrite explicitly defined agents in @agents block', async () => {
    const agentsDir = join(localPath, 'agents');
    await mkdir(agentsDir, { recursive: true });
    await writeFile(
      join(agentsDir, 'planner.md'),
      '---\nname: planner\ndescription: Discovered planner\n---\nDiscovered content.'
    );

    const sourceFile = join(localPath, 'project.prs');
    const ast: Program = {
      ...emptyAst(sourceFile),
      blocks: [
        {
          type: 'Block' as const,
          name: 'agents',
          content: {
            type: 'ObjectContent' as const,
            properties: {
              planner: {
                description: 'Explicit planner from .prs',
              },
            },
            loc: { file: sourceFile, line: 1, column: 1 },
          },
          loc: { file: sourceFile, line: 1, column: 1, offset: 0 },
        },
      ],
    };

    const result = await resolveNativeAgents(ast, sourceFile, localPath);
    const agentsBlock = result.blocks.find((b) => b.name === 'agents');
    const props = (agentsBlock!.content as ObjectContent).properties;
    const planner = props['planner'] as Record<string, unknown>;
    expect(planner['description']).toBe('Explicit planner from .prs');
  });

  it('should discover from universal directory', async () => {
    const universalDir = join(tempDir, '.agents', 'agents');
    await mkdir(universalDir, { recursive: true });
    await writeFile(
      join(universalDir, 'helper.md'),
      '---\nname: helper\ndescription: Universal helper\nmodel: haiku\n---\nHelper content.'
    );

    const ast = emptyAst(join(localPath, 'project.prs'));
    const result = await resolveNativeAgents(ast, ast.loc.file, localPath, {
      universalDir: '.agents',
    });

    const agentsBlock = result.blocks.find((b) => b.name === 'agents');
    const props = (agentsBlock!.content as ObjectContent).properties;
    expect(props['helper']).toBeDefined();
    const helper = props['helper'] as Record<string, unknown>;
    expect(helper['model']).toBe('haiku');
  });

  it('should prefer local over universal for same agent name', async () => {
    // Local
    const localAgents = join(localPath, 'agents');
    await mkdir(localAgents, { recursive: true });
    await writeFile(
      join(localAgents, 'planner.md'),
      '---\nname: planner\ndescription: Local planner\n---\nLocal.'
    );

    // Universal
    const universalDir = join(tempDir, '.agents', 'agents');
    await mkdir(universalDir, { recursive: true });
    await writeFile(
      join(universalDir, 'planner.md'),
      '---\nname: planner\ndescription: Universal planner\n---\nUniversal.'
    );

    const ast = emptyAst(join(localPath, 'project.prs'));
    const result = await resolveNativeAgents(ast, ast.loc.file, localPath, {
      universalDir: '.agents',
    });

    const agentsBlock = result.blocks.find((b) => b.name === 'agents');
    const props = (agentsBlock!.content as ObjectContent).properties;
    const planner = props['planner'] as Record<string, unknown>;
    expect(planner['description']).toBe('Local planner');
  });

  it('should handle --- inside frontmatter values without breaking parser', async () => {
    const agentsDir = join(localPath, 'agents');
    await mkdir(agentsDir, { recursive: true });
    await writeFile(
      join(agentsDir, 'tricky.md'),
      '---\nname: test---name\ndescription: Has dashes\n---\nBody content.'
    );

    const ast = emptyAst(join(localPath, 'project.prs'));
    const result = await resolveNativeAgents(ast, ast.loc.file, localPath);

    const agentsBlock = result.blocks.find((b) => b.name === 'agents');
    expect(agentsBlock).toBeDefined();
    const props = (agentsBlock!.content as ObjectContent).properties;
    // Name comes from frontmatter, not broken by --- in value
    expect(props['test---name']).toBeDefined();
  });

  it('should skip agents with unsafe names (path traversal)', async () => {
    const agentsDir = join(localPath, 'agents');
    await mkdir(agentsDir, { recursive: true });
    await writeFile(
      join(agentsDir, 'bad.md'),
      '---\nname: ../../../etc/passwd\ndescription: Evil agent\n---\nEvil.'
    );

    const ast = emptyAst(join(localPath, 'project.prs'));
    const result = await resolveNativeAgents(ast, ast.loc.file, localPath);
    expect(result).toBe(ast); // No agents added
  });

  it('should fall back to filename when name is empty string', async () => {
    const agentsDir = join(localPath, 'agents');
    await mkdir(agentsDir, { recursive: true });
    await writeFile(
      join(agentsDir, 'fallback.md'),
      '---\nname: ""\ndescription: Agent with empty name\n---\nContent.'
    );

    const ast = emptyAst(join(localPath, 'project.prs'));
    const result = await resolveNativeAgents(ast, ast.loc.file, localPath);

    const agentsBlock = result.blocks.find((b) => b.name === 'agents');
    expect(agentsBlock).toBeDefined();
    const props = (agentsBlock!.content as ObjectContent).properties;
    // Falls back to filename 'fallback'
    expect(props['fallback']).toBeDefined();
  });

  it('should handle block-style tools gracefully (not crash)', async () => {
    const agentsDir = join(localPath, 'agents');
    await mkdir(agentsDir, { recursive: true });
    // Block-style YAML: tools has empty value, items on next lines
    await writeFile(
      join(agentsDir, 'block-tools.md'),
      '---\nname: block-tools\ndescription: Has block tools\ntools:\n---\nContent.'
    );

    const ast = emptyAst(join(localPath, 'project.prs'));
    const result = await resolveNativeAgents(ast, ast.loc.file, localPath);

    const agentsBlock = result.blocks.find((b) => b.name === 'agents');
    expect(agentsBlock).toBeDefined();
    const props = (agentsBlock!.content as ObjectContent).properties;
    const agent = props['block-tools'] as Record<string, unknown>;
    // tools not set (block-style not parsed), but agent still discovered
    expect(agent['description']).toBe('Has block tools');
    expect(agent['tools']).toBeUndefined();
  });

  it('should merge discovered agents with existing @agents block', async () => {
    const agentsDir = join(localPath, 'agents');
    await mkdir(agentsDir, { recursive: true });
    await writeFile(
      join(agentsDir, 'new-agent.md'),
      '---\nname: new-agent\ndescription: Discovered agent\n---\nNew content.'
    );

    const sourceFile = join(localPath, 'project.prs');
    const ast: Program = {
      ...emptyAst(sourceFile),
      blocks: [
        {
          type: 'Block' as const,
          name: 'agents',
          content: {
            type: 'ObjectContent' as const,
            properties: {
              existing: { description: 'Already defined' },
            },
            loc: { file: sourceFile, line: 1, column: 1 },
          },
          loc: { file: sourceFile, line: 1, column: 1, offset: 0 },
        },
      ],
    };

    const result = await resolveNativeAgents(ast, sourceFile, localPath);
    const agentsBlock = result.blocks.find((b) => b.name === 'agents');
    const props = (agentsBlock!.content as ObjectContent).properties;
    // Both existing and new agent present
    expect(props['existing']).toBeDefined();
    expect(props['new-agent']).toBeDefined();
  });

  it('should return unchanged AST when localPath is undefined', async () => {
    const ast = emptyAst('/fake/project.prs');
    const result = await resolveNativeAgents(ast, ast.loc.file, undefined);
    expect(result).toBe(ast);
  });

  it('should skip symlinked agent files', async () => {
    const agentsDir = join(localPath, 'agents');
    await mkdir(agentsDir, { recursive: true });

    // Create a real file and a symlink to it
    const realFile = join(tempDir, 'real-agent.md');
    await writeFile(realFile, '---\nname: linked\ndescription: Symlinked\n---\nContent.');
    try {
      await symlink(realFile, join(agentsDir, 'linked.md'));
    } catch {
      // Symlink creation may fail on some CI environments — skip test
      return;
    }

    const ast = emptyAst(join(localPath, 'project.prs'));
    const result = await resolveNativeAgents(ast, ast.loc.file, localPath);
    // Symlinked file should be skipped
    expect(result).toBe(ast);
  });

  it('should skip binary files (containing null bytes)', async () => {
    const agentsDir = join(localPath, 'agents');
    await mkdir(agentsDir, { recursive: true });
    // Write a file with null byte in content
    await writeFile(
      join(agentsDir, 'binary.md'),
      '---\nname: bin\ndescription: Bin\n---\nHas\0null.'
    );

    const ast = emptyAst(join(localPath, 'project.prs'));
    const result = await resolveNativeAgents(ast, ast.loc.file, localPath);
    expect(result).toBe(ast);
  });

  it('should skip non-.md files', async () => {
    const agentsDir = join(localPath, 'agents');
    await mkdir(agentsDir, { recursive: true });
    await writeFile(
      join(agentsDir, 'agent.txt'),
      '---\nname: txt\ndescription: Not markdown\n---\nContent.'
    );

    const ast = emptyAst(join(localPath, 'project.prs'));
    const result = await resolveNativeAgents(ast, ast.loc.file, localPath);
    expect(result).toBe(ast);
  });

  it('should handle frontmatter with no closing ---', async () => {
    const agentsDir = join(localPath, 'agents');
    await mkdir(agentsDir, { recursive: true });
    await writeFile(join(agentsDir, 'noclosing.md'), '---\nname: broken\ndescription: No close\n');

    const ast = emptyAst(join(localPath, 'project.prs'));
    const result = await resolveNativeAgents(ast, ast.loc.file, localPath);
    expect(result).toBe(ast);
  });

  it('should handle frontmatter lines without colons', async () => {
    const agentsDir = join(localPath, 'agents');
    await mkdir(agentsDir, { recursive: true });
    await writeFile(
      join(agentsDir, 'extralines.md'),
      '---\nname: extra\ndescription: Has extra lines\nno-colon-line\n---\nContent.'
    );

    const ast = emptyAst(join(localPath, 'project.prs'));
    const result = await resolveNativeAgents(ast, ast.loc.file, localPath);
    const agentsBlock = result.blocks.find((b) => b.name === 'agents');
    expect(agentsBlock).toBeDefined();
    const props = (agentsBlock!.content as ObjectContent).properties;
    expect(props['extra']).toBeDefined();
  });

  it('should skip agent with name containing backslash', async () => {
    const agentsDir = join(localPath, 'agents');
    await mkdir(agentsDir, { recursive: true });
    await writeFile(
      join(agentsDir, 'bad2.md'),
      '---\nname: path\\traversal\ndescription: Backslash\n---\nContent.'
    );

    const ast = emptyAst(join(localPath, 'project.prs'));
    const result = await resolveNativeAgents(ast, ast.loc.file, localPath);
    expect(result).toBe(ast);
  });

  it('should skip oversized agent files (>1MB)', async () => {
    const agentsDir = join(localPath, 'agents');
    await mkdir(agentsDir, { recursive: true });
    // Create a file slightly over 1MB
    const header = '---\nname: big\ndescription: Oversized agent\n---\n';
    const padding = 'x'.repeat(1_048_577 - header.length);
    await writeFile(join(agentsDir, 'big.md'), header + padding);

    const ast = emptyAst(join(localPath, 'project.prs'));
    const result = await resolveNativeAgents(ast, ast.loc.file, localPath);
    expect(result).toBe(ast);
  });

  it('should skip files that cannot be read (permissions)', async () => {
    const agentsDir = join(localPath, 'agents');
    await mkdir(agentsDir, { recursive: true });
    const filePath = join(agentsDir, 'unreadable.md');
    await writeFile(filePath, '---\nname: secret\ndescription: No access\n---\nContent.');
    // Remove read permission
    const { chmod } = await import('fs/promises');
    await chmod(filePath, 0o000);

    const ast = emptyAst(join(localPath, 'project.prs'));
    try {
      const result = await resolveNativeAgents(ast, ast.loc.file, localPath);
      // Should skip the unreadable file, not crash
      expect(result).toBe(ast);
    } finally {
      // Restore permissions for cleanup
      await chmod(filePath, 0o644);
    }
  });
});
