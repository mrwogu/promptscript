import { describe, it, expect } from 'vitest';
import { parseSkillMd } from '../skills.js';

describe('parseSkillMd with params', () => {
  it('parses params from YAML frontmatter', () => {
    const content = `---
name: code-review
description: Review {{language}} code
params:
  language:
    type: string
    default: typescript
  strictness:
    type: enum
    options: [relaxed, standard, strict]
    default: standard
---

Review {{language}} code.`;

    const result = parseSkillMd(content);
    expect(result.name).toBe('code-review');
    expect(result.params).toHaveLength(2);
    expect(result.params![0]!.name).toBe('language');
    expect(result.params![0]!.paramType).toEqual({ kind: 'string' });
    expect(result.params![0]!.defaultValue).toBe('typescript');
    expect(result.params![1]!.name).toBe('strictness');
    expect(result.params![1]!.paramType).toEqual({
      kind: 'enum',
      options: ['relaxed', 'standard', 'strict'],
    });
    expect(result.params![1]!.defaultValue).toBe('standard');
  });

  it('works without params (backward compat)', () => {
    const content = `---
name: simple-skill
description: A simple skill
---

Do something.`;

    const result = parseSkillMd(content);
    expect(result.params).toBeUndefined();
  });

  it('parses boolean params', () => {
    const content = `---
name: lint
description: Lint code
params:
  strict:
    type: boolean
    default: true
---

Lint code.`;

    const result = parseSkillMd(content);
    expect(result.params).toHaveLength(1);
    expect(result.params![0]!.paramType).toEqual({ kind: 'boolean' });
    expect(result.params![0]!.defaultValue).toBe(true);
  });

  it('parses number params', () => {
    const content = `---
name: review
description: Review code
params:
  maxFiles:
    type: number
    default: 10
---

Review.`;

    const result = parseSkillMd(content);
    expect(result.params).toHaveLength(1);
    expect(result.params![0]!.paramType).toEqual({ kind: 'number' });
    expect(result.params![0]!.defaultValue).toBe(10);
  });

  it('marks params without default as required', () => {
    const content = `---
name: deploy
description: Deploy to {{env}}
params:
  env:
    type: string
---

Deploy to {{env}}.`;

    const result = parseSkillMd(content);
    expect(result.params).toHaveLength(1);
    expect(result.params![0]!.optional).toBe(false);
    expect(result.params![0]!.defaultValue).toBeUndefined();
  });

  it('marks params with default as optional', () => {
    const content = `---
name: test
description: Test
params:
  verbose:
    type: boolean
    default: false
---

Test.`;

    const result = parseSkillMd(content);
    expect(result.params![0]!.optional).toBe(true);
  });

  it('handles no frontmatter at all', () => {
    const result = parseSkillMd('Just some content.');
    expect(result.params).toBeUndefined();
    expect(result.content).toBe('Just some content.');
  });
});
