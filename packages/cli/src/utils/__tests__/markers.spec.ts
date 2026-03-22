import { describe, it, expect } from 'vitest';
import { stripMarkers } from '../markers.js';

describe('stripMarkers', () => {
  it('should remove HTML comment markers', () => {
    const content = '<!-- PromptScript 2026-03-22T16:36:39.660Z - do not edit -->\n\n# Title';
    expect(stripMarkers(content)).toBe('# Title');
  });

  it('should remove YAML comment markers', () => {
    const content = '---\n# promptscript-generated: 2026-03-22T16:36:39.660Z\nname: test\n---';
    expect(stripMarkers(content)).toBe('---\nname: test\n---');
  });

  it('should remove multiple markers in the same content', () => {
    const content =
      '<!-- PromptScript 2026-03-22 - do not edit -->\n# Title\n# promptscript-generated: 2026-03-22\nBody';
    const result = stripMarkers(content);
    expect(result).toBe('# Title\nBody');
  });

  it('should preserve content without markers', () => {
    const content = '# Regular Markdown\n\nSome content here.';
    expect(stripMarkers(content)).toBe(content);
  });

  it('should handle empty string', () => {
    expect(stripMarkers('')).toBe('');
  });

  it('should not remove regular HTML comments', () => {
    const content = '<!-- This is a regular comment -->\nContent';
    expect(stripMarkers(content)).toBe(content);
  });

  it('should not remove regular YAML comments', () => {
    const content = '# This is a regular YAML comment\nkey: value';
    expect(stripMarkers(content)).toBe(content);
  });
});
