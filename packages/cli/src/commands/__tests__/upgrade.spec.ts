import { describe, it, expect } from 'vitest';
import { fixSyntaxVersion } from '../validate.js';

describe('prs upgrade', () => {
  it('fixSyntaxVersion upgrades to target version', () => {
    const content = `@meta {
  id: "test"
  syntax: "1.0.0"
}

@identity { "test" }
`;
    const result = fixSyntaxVersion(content, '1.0.0', '1.1.0');
    expect(result).toContain('syntax: "1.1.0"');
  });

  it('fixSyntaxVersion skips files already at target', () => {
    const content = `@meta {
  id: "test"
  syntax: "1.1.0"
}
`;
    const result = fixSyntaxVersion(content, '1.1.0', '1.1.0');
    expect(result).toBeNull();
  });

  it('fixSyntaxVersion returns null for files without @meta', () => {
    const content = `@context { "just context" }`;
    const result = fixSyntaxVersion(content, '1.0.0', '1.1.0');
    expect(result).toBeNull();
  });
});
