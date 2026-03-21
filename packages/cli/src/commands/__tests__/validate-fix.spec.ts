import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { fixSyntaxVersion, discoverPrsFiles } from '../validate.js';

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
});
