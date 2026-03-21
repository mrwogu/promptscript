import { describe, it, expect } from 'vitest';
import { fixSyntaxVersion } from '../validate.js';

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
