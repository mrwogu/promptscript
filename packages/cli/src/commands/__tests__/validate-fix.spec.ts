import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync, symlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { fixSyntaxVersion, discoverPrsFiles, validateCommand } from '../validate.js';

describe('fixSyntaxVersion', () => {
  it('should update syntax version when target is higher', () => {
    const content = `@meta {
  id: "test"
  syntax: "1.0.0"
}

@agents {
  helper: { description: "test" content: "test" }
}
`;
    const result = fixSyntaxVersion(content, '1.0.0', '1.1.0');
    expect(result).toContain('syntax: "1.1.0"');
    expect(result).not.toContain('syntax: "1.0.0"');
  });

  it('should not downgrade syntax version', () => {
    const content = `@meta {
  id: "test"
  syntax: "1.1.0"
}
`;
    const result = fixSyntaxVersion(content, '1.1.0', '1.0.0');
    expect(result).toBeNull();
  });

  it('should return null when versions are equal', () => {
    const content = `@meta {
  id: "test"
  syntax: "1.0.0"
}
`;
    const result = fixSyntaxVersion(content, '1.0.0', '1.0.0');
    expect(result).toBeNull();
  });

  it('should only replace syntax within @meta block', () => {
    const content = `@meta {
  id: "test"
  syntax: "1.0.0"
}

@context {
  "The syntax: \\"1.0.0\\" is the old format"
}
`;
    const result = fixSyntaxVersion(content, '1.0.0', '1.1.0');
    expect(result).toContain('syntax: "1.1.0"');
    expect(result).toContain('The syntax: \\"1.0.0\\" is the old format');
  });

  it('should return null when no @meta block', () => {
    const content = `@identity { "test" }`;
    const result = fixSyntaxVersion(content, '1.0.0', '1.1.0');
    expect(result).toBeNull();
  });

  it('should handle braces inside strings in @meta block', () => {
    const content = `@meta {
  id: "test-{project}"
  syntax: "1.0.0"
}
`;
    const result = fixSyntaxVersion(content, '1.0.0', '1.1.0');
    expect(result).toContain('syntax: "1.1.0"');
    expect(result).toContain('id: "test-{project}"');
  });

  it('should ignore comment braces and escaped backslashes', () => {
    const content = `@meta # { ignored
{
  id: "test\\\\"
  # } ignored
  syntax: "1.0.0"
}
`;

    const result = fixSyntaxVersion(content, '1.0.0', '1.1.0', 0);

    expect(result).toContain('id: "test\\\\"');
    expect(result).toContain('syntax: "1.1.0"');
  });
});

describe('discoverPrsFiles', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'prs-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should find .prs files in a directory', () => {
    writeFileSync(join(tmpDir, 'project.prs'), '@meta { id: "test" syntax: "1.0.0" }');
    writeFileSync(join(tmpDir, 'context.prs'), '@context { "test" }');
    writeFileSync(join(tmpDir, 'readme.md'), '# Readme');

    const files = discoverPrsFiles(tmpDir);
    expect(files).toHaveLength(2);
    expect(files.every((f) => f.endsWith('.prs'))).toBe(true);
  });

  it('should find .prs files in subdirectories', () => {
    mkdirSync(join(tmpDir, 'sub'));
    writeFileSync(join(tmpDir, 'project.prs'), 'root');
    writeFileSync(join(tmpDir, 'sub', 'child.prs'), 'child');

    const files = discoverPrsFiles(tmpDir);
    expect(files).toHaveLength(2);
    expect(files.some((f) => f.includes('sub'))).toBe(true);
  });

  it('should return empty array for non-existent directory', () => {
    const files = discoverPrsFiles(join(tmpDir, 'nonexistent'));
    expect(files).toHaveLength(0);
  });

  it('should return empty array for directory with no .prs files', () => {
    writeFileSync(join(tmpDir, 'readme.md'), '# Readme');

    const files = discoverPrsFiles(tmpDir);
    expect(files).toHaveLength(0);
  });

  it('should not discover symbolic links by default', () => {
    const outsidePath = join(tmpDir, 'outside.txt');
    writeFileSync(outsidePath, '@meta { id: "outside" syntax: "1.0.0" }');
    symlinkSync(outsidePath, join(tmpDir, 'linked.prs'));

    const files = discoverPrsFiles(tmpDir);

    expect(files).toHaveLength(0);
  });
});

describe('validateCommand --fix', () => {
  let tmpDir: string;
  let origCwd: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'prs-fix-'));
    origCwd = process.cwd();
    process.chdir(tmpDir);
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.chdir(origCwd);
    rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('should reject --fix with --format json', async () => {
    await expect(validateCommand({ fix: true, format: 'json' })).rejects.toThrow(
      '--fix is incompatible with --format json'
    );
  });

  it('should fix syntax version when blocks require higher version', async () => {
    mkdirSync(join(tmpDir, '.promptscript'), { recursive: true });
    writeFileSync(
      join(tmpDir, '.promptscript', 'project.prs'),
      `@meta {
  id: "test"
  syntax: "1.0.0"
}

@agents {
  helper: {
    description: "A helper"
    content: """
    You are a helper.
    """
  }
}
`
    );

    await validateCommand({ fix: true });

    const content = readFileSync(join(tmpDir, '.promptscript', 'project.prs'), 'utf-8');
    expect(content).toContain('syntax: "1.1.0"');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Fixed'));
  });

  it('should only fix explicitly requested files', async () => {
    mkdirSync(join(tmpDir, 'custom'), { recursive: true });
    const requestedPath = join(tmpDir, 'custom', 'requested.prs');
    const otherPath = join(tmpDir, 'custom', 'other.prs');
    const content = `@meta {
  id: "test"
  syntax: "1.0.0"
}

@agents {
  helper: {
    description: "A helper"
    content: "You are a helper."
  }
}
`;
    writeFileSync(requestedPath, content);
    writeFileSync(otherPath, content);

    await validateCommand({ fix: true, files: ['custom/requested.prs'] });

    expect(readFileSync(requestedPath, 'utf-8')).toContain('syntax: "1.1.0"');
    expect(readFileSync(otherPath, 'utf-8')).toContain('syntax: "1.0.0"');
  });

  it('should fix syntax version when the replace modifier requires 1.3.0', async () => {
    mkdirSync(join(tmpDir, '.promptscript'), { recursive: true });
    writeFileSync(
      join(tmpDir, '.promptscript', 'project.prs'),
      `@meta {
  id: "test"
  syntax: "1.2.0"
}

@standards {
  testing: ["Use Jest"]
}

@extend standards {
  testing!: ["Use Vitest"]
}
`
    );

    await validateCommand({ fix: true });

    const content = readFileSync(join(tmpDir, '.promptscript', 'project.prs'), 'utf-8');
    expect(content).toContain('syntax: "1.3.0"');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Fixed'));
  });

  it('should fix syntax version for inherited replacement usage', async () => {
    mkdirSync(join(tmpDir, '.promptscript'), { recursive: true });
    writeFileSync(
      join(tmpDir, '.promptscript', 'base.prs'),
      `@meta { id: "base" syntax: "1.3.0" }
@standards { testing: ["Use Jest"] }
@extend standards { testing!: ["Use Vitest"] }
`
    );
    writeFileSync(
      join(tmpDir, '.promptscript', 'project.prs'),
      `@meta { id: "project" syntax: "1.2.0" }
@inherit ./base
`
    );

    await validateCommand({ fix: true });

    const content = readFileSync(join(tmpDir, '.promptscript', 'project.prs'), 'utf-8');
    expect(content).toContain('syntax: "1.3.0"');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('project.prs'));
  });

  it('should fix syntax version for replacement usage from a composed skill', async () => {
    mkdirSync(join(tmpDir, '.promptscript'), { recursive: true });
    writeFileSync(
      join(tmpDir, '.promptscript', 'phase.prs'),
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
    writeFileSync(
      join(tmpDir, '.promptscript', 'project.prs'),
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

    await validateCommand({ fix: true });

    const content = readFileSync(join(tmpDir, '.promptscript', 'project.prs'), 'utf-8');
    expect(content).toContain('syntax: "1.3.0"');
  });

  it('should report no fixes needed when syntax is correct', async () => {
    mkdirSync(join(tmpDir, '.promptscript'), { recursive: true });
    writeFileSync(
      join(tmpDir, '.promptscript', 'project.prs'),
      `@meta {
  id: "test"
  syntax: "1.1.0"
}

@agents {
  helper: {
    description: "A helper"
    content: """
    You are a helper.
    """
  }
}
`
    );

    await validateCommand({ fix: true });

    expect(console.log).toHaveBeenCalledWith('No syntax version fixes needed.');
  });

  it('should handle empty .promptscript directory', async () => {
    await validateCommand({ fix: true });

    expect(console.log).toHaveBeenCalledWith('No syntax version fixes needed.');
  });

  it('should skip files without syntax field', async () => {
    mkdirSync(join(tmpDir, '.promptscript'), { recursive: true });
    writeFileSync(
      join(tmpDir, '.promptscript', 'context.prs'),
      `@context {
  """
  Some context
  """
}
`
    );

    await validateCommand({ fix: true });

    expect(console.log).toHaveBeenCalledWith('No syntax version fixes needed.');
  });
});
