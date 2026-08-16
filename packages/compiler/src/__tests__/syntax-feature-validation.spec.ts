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
  it('should report explicit overrides declared below syntax 1.5.0', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'promptscript-syntax-feature-'));
    directories.push(directory);
    const entryPath = join(directory, 'project.prs');
    writeFileSync(
      entryPath,
      `@meta { id: "test" syntax: "1.4.0" }
@standards { testing: ["Use Jest"] }
@override standards.testing { ["Use Vitest"] }
`
    );
    const compiler = new Compiler({
      resolver: { registryPath: directory, projectRoot: directory },
      formatters: [],
    });

    const result = await compiler.compile(entryPath);

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([
      expect.objectContaining({
        ruleId: 'PS018',
        message: expect.stringContaining('explicit-override'),
        location: expect.objectContaining({ file: entryPath, line: 3, column: 1 }),
      }),
    ]);
  });

  it('should retain syntax diagnostics when override resolution fails', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'promptscript-syntax-feature-'));
    directories.push(directory);
    const entryPath = join(directory, 'project.prs');
    writeFileSync(
      entryPath,
      `@meta { id: "test" syntax: "1.4.0" }
@standards { testing: ["Use Jest"] }
@override standards.missing { true }
`
    );
    const compiler = new Compiler({
      resolver: { registryPath: directory, projectRoot: directory },
      formatters: [],
    });

    const result = await compiler.compile(entryPath);

    expect(result.success).toBe(false);
    expect(result.errors).toEqual([
      expect.objectContaining({
        message: expect.stringContaining('does not exist at segment "missing"'),
      }),
    ]);
    expect(result.warnings).toEqual([
      expect.objectContaining({
        ruleId: 'PS018',
        message: expect.stringContaining('explicit-override'),
      }),
    ]);
  });

  it('should honor configured PS018 severity during override failures', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'promptscript-syntax-feature-'));
    directories.push(directory);
    const entryPath = join(directory, 'project.prs');
    writeFileSync(
      entryPath,
      `@meta { id: "test" syntax: "1.4.0" }
@standards { testing: ["Use Jest"] }
@override standards.missing { true }
`
    );
    const errorCompiler = new Compiler({
      resolver: { registryPath: directory, projectRoot: directory, cache: false },
      validator: { rules: { 'syntax-version-compat': 'error' } },
      formatters: [],
    });
    const offCompiler = new Compiler({
      resolver: { registryPath: directory, projectRoot: directory, cache: false },
      validator: { rules: { 'syntax-version-compat': 'off' } },
      formatters: [],
    });

    const errorResult = await errorCompiler.compile(entryPath);
    const offResult = await offCompiler.compile(entryPath);

    expect(errorResult.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining('does not exist at segment "missing"'),
        }),
        expect.objectContaining({
          code: 'PS018',
          message: expect.stringContaining('explicit-override'),
        }),
      ])
    );
    expect(errorResult.warnings).toEqual([]);
    expect(offResult.errors).toEqual([
      expect.objectContaining({
        message: expect.stringContaining('does not exist at segment "missing"'),
      }),
    ]);
    expect(offResult.warnings).toEqual([]);
  });

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

  it('should report ordered-operation usage inherited from another file', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'promptscript-syntax-feature-'));
    directories.push(directory);
    writeFileSync(
      join(directory, 'base.prs'),
      `@meta { id: "base" syntax: "1.5.0" }
@standards { testing: ["Use Jest"] }
`
    );
    const entryPath = join(directory, 'project.prs');
    writeFileSync(
      entryPath,
      `@meta { id: "project" syntax: "1.4.0" }
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
          message: expect.stringContaining('ordered-operations'),
          location: expect.objectContaining({ file: join(directory, 'base.prs') }),
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

  it('should report inherited section header usage at its source location', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'promptscript-syntax-feature-'));
    directories.push(directory);
    const basePath = join(directory, 'base.prs');
    writeFileSync(
      basePath,
      `@meta { id: "base" syntax: "1.4.0" }
@standards {
  @header "Shared Rules"
  code: ["Use strict TypeScript"]
}
`
    );
    const entryPath = join(directory, 'project.prs');
    writeFileSync(
      entryPath,
      `@meta { id: "project" syntax: "1.4.0" }
@inherit ./base
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
          message: expect.stringContaining('section-header-override'),
          location: expect.objectContaining({
            file: basePath,
            line: 3,
            column: 3,
          }),
        }),
      ])
    );
  });

  it('should report inherited legacy heading usage at its source location', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'promptscript-syntax-feature-'));
    directories.push(directory);
    const basePath = join(directory, 'base.prs');
    writeFileSync(
      basePath,
      `@meta { id: "base" syntax: "1.5.0" }
@identity {
  """## Shared Project
  Shared details"""
}
`
    );
    const entryPath = join(directory, 'project.prs');
    writeFileSync(
      entryPath,
      `@meta { id: "project" syntax: "1.4.0" }
@inherit ./base
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
          message: expect.stringContaining('section-header-override'),
          location: expect.objectContaining({
            file: basePath,
            line: 3,
            column: 3,
          }),
        }),
      ])
    );
  });
});
