import { describe, it, expect } from 'vitest';
import { parseSkillMd } from '../skills.js';

describe('parseSkillMd with inputs/outputs', () => {
  it('parses inputs from SKILL.md frontmatter', () => {
    const content = `---
name: security-scan
description: Scan for vulnerabilities
inputs:
  files:
    description: List of file paths
    type: string
  severity:
    description: Minimum severity level
    type: enum
    options: [low, medium, high]
    default: medium
---

Scan the provided files.`;

    const result = parseSkillMd(content);
    expect(result.inputs).toBeDefined();
    expect(Object.keys(result.inputs!)).toEqual(['files', 'severity']);
    expect(result.inputs!['files']!.description).toBe('List of file paths');
    expect(result.inputs!['files']!.type).toBe('string');
    expect(result.inputs!['severity']!.type).toBe('enum');
    expect(result.inputs!['severity']!.options).toEqual(['low', 'medium', 'high']);
    expect(result.inputs!['severity']!.default).toBe('medium');
  });

  it('parses outputs from SKILL.md frontmatter', () => {
    const content = `---
name: security-scan
description: Scan
outputs:
  report:
    description: Scan report
    type: string
  passed:
    description: Whether scan passed
    type: boolean
    default: true
---

Scan content.`;

    const result = parseSkillMd(content);
    expect(result.outputs).toBeDefined();
    expect(Object.keys(result.outputs!)).toEqual(['report', 'passed']);
    expect(result.outputs!['report']!.description).toBe('Scan report');
    expect(result.outputs!['report']!.type).toBe('string');
    expect(result.outputs!['passed']!.type).toBe('boolean');
    expect(result.outputs!['passed']!.default).toBe(true);
  });

  it('parses skill with both inputs, outputs, and params', () => {
    const content = `---
name: full-skill
description: A {{mode}} skill
params:
  mode:
    type: string
    default: standard
inputs:
  files:
    description: Files to process
    type: string
outputs:
  result:
    description: Processing result
    type: string
---

Process files in {{mode}} mode.`;

    const result = parseSkillMd(content);
    expect(result.params).toHaveLength(1);
    expect(result.params![0]!.name).toBe('mode');
    expect(result.inputs).toBeDefined();
    expect(result.inputs!['files']!.description).toBe('Files to process');
    expect(result.outputs).toBeDefined();
    expect(result.outputs!['result']!.description).toBe('Processing result');
  });

  it('works without inputs/outputs (backward compat)', () => {
    const content = `---
name: simple
description: Simple skill
---

Content.`;

    const result = parseSkillMd(content);
    expect(result.inputs).toBeUndefined();
    expect(result.outputs).toBeUndefined();
  });

  it('parses number default values in contract fields', () => {
    const content = `---
name: test
inputs:
  count:
    description: Number of items
    type: number
    default: 42
---

Content.`;

    const result = parseSkillMd(content);
    expect(result.inputs!['count']!.default).toBe(42);
  });
});
