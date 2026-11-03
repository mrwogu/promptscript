import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Compiler } from '../compiler.js';

const directories: string[] = [];

afterEach(() => {
  vi.useRealTimers();
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('composed skill portability', () => {
  it('compiles identical skill text from different absolute roots', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const outputs: string[] = [];
    for (const prefix of ['prs-first-', 'prs-second-']) {
      const root = mkdtempSync(join(tmpdir(), prefix));
      directories.push(root);
      mkdirSync(join(root, 'phases'));
      mkdirSync(join(root, 'other'));
      writeFileSync(
        join(root, 'project.prs'),
        `@meta { id: "portable" syntax: "1.2.0" }
@skills {
  deploy: { description: "Deploy" content: "Start deployment." }
  @use ./phases/check
  @use ./other/check
}`
      );
      writeFileSync(
        join(root, 'phases/check.prs'),
        `@meta { id: "check" syntax: "1.2.0" }
@skills { check: { description: "Check" content: "Check the deployment." } }`
      );
      writeFileSync(
        join(root, 'other/check.prs'),
        `@meta { id: "other-check" syntax: "1.2.0" }
@skills { other-check: { description: "Other" content: "Check twice." } }`
      );
      const compiler = new Compiler({
        resolver: { registryPath: root, projectRoot: root, localPath: root },
        validator: { scanExternalContent: true },
        formatters: [{ name: 'claude', config: { version: 'full' } }],
      });

      const result = await compiler.compile('project.prs');

      expect(result.errors).toEqual([]);
      expect(result.success).toBe(true);
      const content = result.outputs.get('.claude/skills/deploy/SKILL.md')?.content;
      expect(content).toBeDefined();
      expect(content).toContain('<!-- composed-from: phases/check.prs -->');
      expect(content).toContain('<!-- composed-from: other/check.prs -->');
      expect(content).toContain('Check the deployment.');
      expect(content).not.toContain(root);
      outputs.push(content!);
    }
    expect(outputs[0]).toBe(outputs[1]);
  });
});

describe('composed skill params', () => {
  it('interpolates args and defaults into the compiled SKILL.md', async () => {
    const root = mkdtempSync(join(tmpdir(), 'prs-params-'));
    directories.push(root);
    mkdirSync(join(root, 'phases'));
    writeFileSync(
      join(root, 'project.prs'),
      `@meta { id: "ops" syntax: "1.2.0" }
@skills {
  ops: { description: "Ops" content: "Follow the phases." }
  @use ./phases/triage(severity: "critical")
  @use ./phases/triage as fallback
}`
    );
    writeFileSync(
      join(root, 'phases/triage.prs'),
      `@meta { id: "triage" syntax: "1.2.0" params: { severity: string = "all" } }
@restrictions { - "Never rank above {{severity}} threshold" }
@skills { triage: { description: "Triage" content: "Only include findings at or above {{severity}} level." } }`
    );
    const compiler = new Compiler({
      resolver: { registryPath: root, projectRoot: root, localPath: root },
      formatters: [{ name: 'claude', config: { version: 'full' } }],
    });

    const result = await compiler.compile('project.prs');

    expect(result.errors).toEqual([]);
    const content = result.outputs.get('.claude/skills/ops/SKILL.md')?.content;
    expect(content).toContain('Only include findings at or above critical level.');
    expect(content).toContain('Only include findings at or above all level.');
    expect(content).toContain('Never rank above critical threshold');
    expect(content).not.toContain('{{severity}}');
  });
});
