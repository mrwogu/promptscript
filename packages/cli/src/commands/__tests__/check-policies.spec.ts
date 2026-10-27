import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { checkCommand } from '../check.js';
import { validateCommand } from '../validate.js';

const CONFIG = `id: policy-demo
syntax: '1.5.0'
targets:
  - claude
registry:
  path: ./registry
validation:
  skipPolicies: true
policies:
  - name: approved-registries
    kind: registry-allowlist
    description: 'Extensions must come from approved registries'
    severity: error
    allowed: ['@core']
`;

const FILES: Record<string, string> = {
  'promptscript.yaml': CONFIG,
  'registry/@core/skills.prs': `@meta {
  id: "@core/skills"
  syntax: "1.5.0"
}

@skills {
  "code-review": {
    description: "Base code review skill"
    content: """
      Review code for quality, correctness, and security.
    """
  }
}
`,
  'registry/@team/overlay.prs': `@meta {
  id: "@team/overlay"
  syntax: "1.5.0"
}

@use @core/skills

@extend skills.code-review {
  content: """
    Team-specific review checklist.
  """
}
`,
  '.promptscript/project.prs': `@meta {
  id: "policy-demo"
  syntax: "1.5.0"
}

@use @team/overlay
`,
};

describe('prs check with policies', () => {
  let dir: string;
  let origCwd: string;
  let errorLog: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'prs-check-policies-'));
    origCwd = process.cwd();
    process.chdir(dir);
    process.exitCode = undefined;
    for (const [name, content] of Object.entries(FILES)) {
      mkdirSync(dirname(join(dir, name)), { recursive: true });
      writeFileSync(join(dir, name), content);
    }
    vi.spyOn(console, 'log').mockImplementation(() => {});
    errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.chdir(origCwd);
    process.exitCode = undefined;
    rmSync(dir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it.each([
    ['prs check', () => checkCommand({})],
    ['prs validate', () => validateCommand({})],
  ])('%s fails when policies is a mapping instead of a list', async (_name, run) => {
    // Arrange
    const mapping = CONFIG.replace(
      /policies:[\s\S]*$/,
      `policies:
  name: approved-registries
  kind: registry-allowlist
  severity: error
  allowed: ['@core', '@team']
`
    );
    writeFileSync(join(dir, 'promptscript.yaml'), mapping);
    const log = vi.mocked(console.log);

    // Act
    await run();

    // Assert
    const output = [...errorLog.mock.calls, ...log.mock.calls]
      .map((call: unknown[]) => String(call[0]))
      .join('\n');
    expect(output).toContain('"policies" must be a list. Start each policy with "- name:".');
    expect(process.exitCode).toBe(1);
  });

  it('reports a PS030 violation even when the config sets validation.skipPolicies', async () => {
    // Act
    await checkCommand({});

    // Assert
    const output = errorLog.mock.calls.map((call: unknown[]) => String(call[0])).join('\n');
    expect(output).toContain(
      "[approved-registries] Skill 'code-review' was modified by registry '@team'"
    );
    expect(process.exitCode).toBe(1);
  });
});
