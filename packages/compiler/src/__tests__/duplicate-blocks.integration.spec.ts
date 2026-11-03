import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { Compiler } from '../compiler.js';

const directories: string[] = [];

function createProject(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'promptscript-duplicate-blocks-'));
  directories.push(root);
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, name)), { recursive: true });
    writeFileSync(join(root, name), content);
  }
  return root;
}

async function compileProject(root: string): Promise<Awaited<ReturnType<Compiler['compile']>>> {
  const compiler = new Compiler({
    resolver: {
      registryPath: root,
      projectRoot: root,
      localPath: join(root, '.promptscript'),
    },
    formatters: [{ name: 'claude', config: { version: 'full' } }],
  });
  return compiler.compile(join(root, 'project.prs'));
}

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('duplicate blocks with the file system resolver', () => {
  it('should fail the issue repro and write no .mcp.json', async () => {
    const root = createProject({
      'project.prs': `@meta { id: "dup" syntax: "1.4.0" }
@identity { """Probe.""" }
@mcpServers {
}
@mcpServers {
  probe: { transport: "stdio" command: ["node", "probe.mjs"] }
}
`,
    });

    const result = await compileProject(root);

    expect(result.success).toBe(false);
    expect(result.errors.map((e) => e.code)).toContain('PS048');
    expect(result.outputs.has('.mcp.json')).toBe(false);
  });

  it('should report the second @skills block at its own line after skill discovery', async () => {
    const root = createProject({
      '.promptscript/skills/review/SKILL.md':
        '---\nname: review\ndescription: Review code\n---\n\nReview the diff.\n',
      'project.prs': `@meta { id: "dup-skills" syntax: "1.4.0" }
@skills {
  local: { description: "Local skill" content: "Local." }
}

@skills {
  other: { description: "Other skill" content: "Other." }
}
`,
    });

    const result = await compileProject(root);

    expect(result.success).toBe(false);
    const error = result.errors.find((e) => e.code === 'PS048');
    expect(error).toBeDefined();
    expect(error!.location?.line).toBe(6);
    expect(error!.message).toContain('already declared at line 2');
  });

  it('should not flag a child block that merges with an inherited block', async () => {
    const root = createProject({
      'parent.prs': `@meta { id: "parent" syntax: "1.5.0" }
@standards { code: ["Use TypeScript"] }
`,
      'project.prs': `@meta { id: "child" syntax: "1.5.0" }
@inherit ./parent
@standards { testing: ["Use Vitest"] }
`,
    });

    const result = await compileProject(root);

    expect(result.errors).toEqual([]);
    expect(result.success).toBe(true);
  });

  // Known limitation: in sequential mode @inherit merges the parent block into the
  // first local block and keeps the parent's location, so the second local block
  // is no longer seen as a duplicate of a block in the same file.
  it('should not flag two local blocks when an inherited block shares the name (known limitation)', async () => {
    const root = createProject({
      'parent.prs': `@meta { id: "parent" syntax: "1.5.0" }
@standards { code: ["Use TypeScript"] }
`,
      'project.prs': `@meta { id: "child" syntax: "1.5.0" }
@standards { first: ["One"] }
@standards { second: ["Two"] }
@inherit ./parent
`,
    });

    const result = await compileProject(root);

    expect(result.errors).toEqual([]);
    expect(result.success).toBe(true);
  });
});
