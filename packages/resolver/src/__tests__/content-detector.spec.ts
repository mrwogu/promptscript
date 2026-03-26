import { describe, it, expect } from 'vitest';
import { detectContentType } from '../content-detector.js';

describe('detectContentType', () => {
  it('should detect PRS content when @identity is at start of line', () => {
    expect(detectContentType('@identity {\n  role: "dev"\n}')).toBe('prs');
  });

  it('should detect skill when YAML frontmatter present', () => {
    expect(detectContentType('---\nname: my-skill\n---\nBody')).toBe('skill');
  });

  it('should detect raw when no frontmatter and no PRS blocks', () => {
    expect(detectContentType('# My Skill\n\nDo something.')).toBe('raw');
  });

  it('should NOT detect PRS when @identity is inside ``` fence', () => {
    expect(detectContentType('# Guide\n\n```\n@identity {\n  role: "x"\n}\n```\n')).toBe('raw');
  });

  it('should NOT detect PRS when @identity is inside ~~~ fence', () => {
    expect(detectContentType('# Guide\n\n~~~\n@identity {\n  role: "x"\n}\n~~~\n')).toBe('raw');
  });

  it('should NOT detect PRS when only @skills without @identity', () => {
    expect(detectContentType('@skills {\n  foo: { description: "x" }\n}')).toBe('raw');
  });

  it('should detect PRS over skill when both present (PRS wins)', () => {
    expect(detectContentType('---\nname: x\n---\n@identity {\n  role: "y"\n}')).toBe('prs');
  });

  it('should handle fenced code with language identifier', () => {
    expect(detectContentType('```typescript\n@identity { role: "x" }\n```\n')).toBe('raw');
  });

  it('should handle BOM prefix', () => {
    expect(detectContentType('\uFEFF---\nname: skill\n---\nBody')).toBe('skill');
  });

  it('should return raw for empty content', () => {
    expect(detectContentType('')).toBe('raw');
  });
});
