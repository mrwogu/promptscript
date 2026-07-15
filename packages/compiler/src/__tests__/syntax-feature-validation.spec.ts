import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Compiler } from '../compiler.js';

const directories: string[] = [];

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('syntax feature validation after resolution', () => {
  it('should report replace modifiers declared with syntax 1.2.0', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'promptscript-syntax-feature-'));
    directories.push(directory);
    const entryPath = join(directory, 'project.prs');
    writeFileSync(
      entryPath,
      `@meta { id: "test" syntax: "1.2.0" }
@standards {
  testing: ["Use Jest"]
}
@extend standards {
  testing!: ["Use Vitest"]
}
`
    );

    const compiler = new Compiler({
      resolver: { registryPath: directory },
      formatters: [],
    });

    const result = await compiler.compile(entryPath);

    expect(result.errors).toEqual([]);
    expect(result.success).toBe(true);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'PS018',
          message: expect.stringContaining('regular-block-replace'),
        }),
      ])
    );
  });

  it('should report replacement usage inherited from another file', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'promptscript-syntax-feature-'));
    directories.push(directory);
    writeFileSync(
      join(directory, 'base.prs'),
      `@meta { id: "base" syntax: "1.3.0" }
@standards { testing: ["Use Jest"] }
@extend standards { testing!: ["Use Vitest"] }
`
    );
    const entryPath = join(directory, 'project.prs');
    writeFileSync(
      entryPath,
      `@meta { id: "project" syntax: "1.2.0" }
@inherit ./base
`
    );
    const compiler = new Compiler({
      resolver: { registryPath: directory, projectRoot: directory },
      formatters: [],
    });

    const result = await compiler.compile(entryPath);

    expect(result.errors).toEqual([]);
    expect(result.success).toBe(true);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'PS018',
          message: expect.stringContaining('regular-block-replace'),
        }),
      ])
    );
  });

  it('should report replacement usage from an inline composed skill', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'promptscript-syntax-feature-'));
    directories.push(directory);
    writeFileSync(
      join(directory, 'phase.prs'),
      `@meta { id: "phase" syntax: "1.3.0" }
@skills {
  phase: {
    description: "Run a phase"
    content: "Run phase instructions"
  }
}
@standards { testing: ["Use Jest"] }
@extend standards { testing!: ["Use Vitest"] }
`
    );
    const entryPath = join(directory, 'project.prs');
    writeFileSync(
      entryPath,
      `@meta { id: "project" syntax: "1.2.0" }
@skills {
  project: {
    description: "Run project"
    content: "Run project instructions"
  }
  @use ./phase
}
`
    );
    const compiler = new Compiler({
      resolver: { registryPath: directory, projectRoot: directory },
      formatters: [],
    });

    const result = await compiler.compile(entryPath);

    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'PS018',
          message: expect.stringContaining('regular-block-replace'),
        }),
      ])
    );
  });
});
