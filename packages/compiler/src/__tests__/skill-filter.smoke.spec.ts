import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Compiler } from '../compiler.js';

const directories: string[] = [];

function createDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'promptscript-skill-filter-'));
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

/**
 * Skill library .prs file with multiple skills.
 * Used by all smoke tests below.
 */
const SKILL_LIBRARY_PRS = `@meta {
  id: "skill-library"
  syntax: "1.2.0"
}

@skills {
  code-review: {
    description: "Review code for bugs and improvements"
    content: """
    Check for bugs, edge cases, and code quality issues.
    """
  }

  testing: {
    description: "Write and run tests"
    content: """
    Generate test cases following AAA pattern.
    """
  }

  deployment: {
    description: "Deploy services to production"
    content: """
    Run health checks and deploy with zero downtime.
    """
  }

  legacy-support: {
    description: "Support legacy code patterns"
    content: """
    Provide backward-compatible fixes for old code.
    """
  }
}
`;

describe('Skill filtering smoke tests (includes/excludes)', () => {
  it('includes filter imports only specified skills through full compile pipeline', async () => {
    const directory = createDirectory();
    writeFileSync(join(directory, 'skill-library.prs'), SKILL_LIBRARY_PRS);
    writeFileSync(
      join(directory, 'project.prs'),
      `@meta {
  id: "skill-filter-includes"
  syntax: "1.2.0"
}

@use ./skill-library(includes: ["code-review", "testing"])

@identity {
  """
  You are a development assistant with curated skills.
  """
}
`
    );

    const compiler = new Compiler({
      resolver: { registryPath: directory, projectRoot: directory },
      formatters: [{ name: 'claude', config: { version: 'full' } }],
    });

    const result = await compiler.compile(join(directory, 'project.prs'));

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);

    // Included skills should be present in output
    expect(requireOutput(result, '.claude/skills/code-review/SKILL.md')).toContain(
      'Review code for bugs'
    );
    expect(requireOutput(result, '.claude/skills/testing/SKILL.md')).toContain(
      'Write and run tests'
    );

    // Excluded skills should NOT be present
    expect(result.outputs.has('.claude/skills/deployment/SKILL.md')).toBe(false);
    expect(result.outputs.has('.claude/skills/legacy-support/SKILL.md')).toBe(false);
  });

  it('excludes filter removes specified skills through full compile pipeline', async () => {
    const directory = createDirectory();
    writeFileSync(join(directory, 'skill-library.prs'), SKILL_LIBRARY_PRS);
    writeFileSync(
      join(directory, 'project.prs'),
      `@meta {
  id: "skill-filter-excludes"
  syntax: "1.2.0"
}

@use ./skill-library(excludes: ["legacy-support", "deployment"])

@identity {
  """
  You are a development assistant without legacy skills.
  """
}
`
    );

    const compiler = new Compiler({
      resolver: { registryPath: directory, projectRoot: directory },
      formatters: [{ name: 'claude', config: { version: 'full' } }],
    });

    const result = await compiler.compile(join(directory, 'project.prs'));

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);

    // Remaining skills should be present
    expect(requireOutput(result, '.claude/skills/code-review/SKILL.md')).toContain(
      'Review code for bugs'
    );
    expect(requireOutput(result, '.claude/skills/testing/SKILL.md')).toContain(
      'Write and run tests'
    );

    // Excluded skills should NOT be present
    expect(result.outputs.has('.claude/skills/legacy-support/SKILL.md')).toBe(false);
    expect(result.outputs.has('.claude/skills/deployment/SKILL.md')).toBe(false);
  });

  it('no filter imports all skills (backward compatibility)', async () => {
    const directory = createDirectory();
    writeFileSync(join(directory, 'skill-library.prs'), SKILL_LIBRARY_PRS);
    writeFileSync(
      join(directory, 'project.prs'),
      `@meta {
  id: "skill-filter-none"
  syntax: "1.2.0"
}

@use ./skill-library

@identity {
  """
  You are a development assistant with all skills.
  """
}
`
    );

    const compiler = new Compiler({
      resolver: { registryPath: directory, projectRoot: directory },
      formatters: [{ name: 'claude', config: { version: 'full' } }],
    });

    const result = await compiler.compile(join(directory, 'project.prs'));

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);

    // All four skills should be present
    expect(requireOutput(result, '.claude/skills/code-review/SKILL.md')).toContain(
      'Review code for bugs'
    );
    expect(requireOutput(result, '.claude/skills/testing/SKILL.md')).toContain(
      'Write and run tests'
    );
    expect(requireOutput(result, '.claude/skills/deployment/SKILL.md')).toContain(
      'Deploy services'
    );
    expect(requireOutput(result, '.claude/skills/legacy-support/SKILL.md')).toContain(
      'Support legacy code'
    );
  });

  it('includes filter works combined with only block filter', async () => {
    const directory = createDirectory();
    writeFileSync(
      join(directory, 'shared.prs'),
      `@meta {
  id: "shared"
  syntax: "1.2.0"
}

@context {
  project: "Shared Project"
}

@skills {
  alpha: {
    description: "Alpha skill"
    content: "Alpha instructions."
  }

  beta: {
    description: "Beta skill"
    content: "Beta instructions."
  }
}
`
    );
    writeFileSync(
      join(directory, 'project.prs'),
      `@meta {
  id: "skill-filter-combined"
  syntax: "1.2.0"
}

@use ./shared(only: ["skills"], includes: ["alpha"])

@identity {
  """
  You are an assistant with one skill.
  """
}
`
    );

    const compiler = new Compiler({
      resolver: { registryPath: directory, projectRoot: directory },
      formatters: [{ name: 'claude', config: { version: 'full' } }],
    });

    const result = await compiler.compile(join(directory, 'project.prs'));

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);

    // Only alpha skill should be present (beta filtered out by includes)
    expect(requireOutput(result, '.claude/skills/alpha/SKILL.md')).toContain('Alpha skill');
    expect(result.outputs.has('.claude/skills/beta/SKILL.md')).toBe(false);

    // Context block should NOT be present (filtered out by only: ["skills"])
    const claudeOutput = requireOutput(result, 'CLAUDE.md');
    expect(claudeOutput).not.toContain('Shared Project');
  });

  it('includes filter does not leak reserved params to template interpolation', async () => {
    // If includes/excludes leak to bindParams, compilation fails with
    // UnknownParamError because the source has no @meta params.
    const directory = createDirectory();
    writeFileSync(join(directory, 'skill-library.prs'), SKILL_LIBRARY_PRS);
    writeFileSync(
      join(directory, 'project.prs'),
      `@meta {
  id: "skill-filter-no-leak"
  syntax: "1.2.0"
}

@use ./skill-library(includes: ["code-review"])

@identity {
  """
  You are a development assistant.
  """
}
`
    );

    const compiler = new Compiler({
      resolver: { registryPath: directory, projectRoot: directory },
      formatters: [{ name: 'claude', config: { version: 'full' } }],
    });

    const result = await compiler.compile(join(directory, 'project.prs'));

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    expect(requireOutput(result, '.claude/skills/code-review/SKILL.md')).toContain(
      'Review code for bugs'
    );
  });
});
