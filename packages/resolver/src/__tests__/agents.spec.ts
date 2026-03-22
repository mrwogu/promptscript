import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, mkdir, rm } from 'fs/promises';
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
});
