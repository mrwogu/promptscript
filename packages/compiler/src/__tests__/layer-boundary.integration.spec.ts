import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import type { PolicyDefinition } from '@promptscript/core';
import { Compiler } from '../compiler.js';

const directories: string[] = [];

const LAYER_POLICY: PolicyDefinition = {
  name: 'adjacent-layers',
  kind: 'layer-boundary',
  description: 'Only adjacent layers can extend each other',
  severity: 'error',
  layers: ['@core', '@team', '@project'],
  maxDistance: 1,
};

function overlay(id: string, content: string): string {
  return `@meta {
  id: "${id}"
  syntax: "1.5.0"
}

@use @core/skills

@extend skills.code-review {
  content: """
    ${content}
  """
}
`;
}

function createProject(overlayPath: string): { entryPath: string; registryPath: string } {
  const root = mkdtempSync(join(tmpdir(), 'promptscript-layer-boundary-'));
  directories.push(root);
  const files: Record<string, string> = {
    'registry/@core/skills.prs': `@meta {
  id: "@core/skills"
  syntax: "1.5.0"
}

@skills {
  "code-review": {
    description: "Base code review skill"
    content: """
      Review code for quality, correctness, and security.
    """
  }
}
`,
    [`registry/${overlayPath}.prs`]: overlay(overlayPath, 'Layer specific review checklist.'),
    'project.prs': `@meta {
  id: "demo-project"
  syntax: "1.5.0"
}

@use ${overlayPath}
`,
  };
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, name)), { recursive: true });
    writeFileSync(join(root, name), content);
  }
  return { entryPath: join(root, 'project.prs'), registryPath: join(root, 'registry') };
}

async function compile(overlayPath: string): Promise<Awaited<ReturnType<Compiler['compile']>>> {
  const { entryPath, registryPath } = createProject(overlayPath);
  const compiler = new Compiler({
    resolver: { registryPath, projectRoot: dirname(entryPath) },
    validator: { policies: [LAYER_POLICY] },
    formatters: [],
  });
  return compiler.compile(entryPath);
}

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('layer-boundary policy', () => {
  it('reports an extension that skips a layer', async () => {
    const result = await compile('@project/overlay');

    expect(result.success).toBe(false);
    expect(result.errors.map((error) => error.message)).toContainEqual(
      expect.stringContaining(
        "[adjacent-layers] Skill 'code-review' property 'content' was overridden by '@project' which is 2 layer(s) away from '@core'"
      )
    );
  });

  it('accepts an extension from the adjacent layer', async () => {
    const result = await compile('@team/overlay');

    expect(result.errors).toEqual([]);
  });
});
