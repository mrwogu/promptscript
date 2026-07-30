import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Compiler } from '../compiler.js';

const directories: string[] = [];

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('Hook target smoke tests', () => {
  it('compiles one portable hook to current Factory and GitHub contracts', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'promptscript-hooks-targets-'));
    directories.push(directory);
    const entryPath = join(directory, 'project.prs');
    writeFileSync(
      entryPath,
      `@meta {
  id: "hook-target-smoke"
  syntax: "1.4.0"
}

@hooks {
  validate: {
    event: "pre-tool-use"
    matcher: "Edit|Write"
    command: ["python3", ".promptscript/scripts/validate.py"]
    timeoutMs: 30000
  }
}
`
    );

    const compiler = new Compiler({
      resolver: { registryPath: directory, projectRoot: directory },
      formatters: [
        { name: 'factory', config: { version: 'full' } },
        { name: 'github', config: { version: 'full' } },
      ],
    });

    const result = await compiler.compile(entryPath);

    expect(result.success).toBe(true);
    expect(JSON.parse(result.outputs.get('.factory/hooks.json')!.content)).toEqual({
      hooks: {
        PreToolUse: [
          {
            matcher: 'Edit|Write',
            hooks: [
              {
                type: 'command',
                command:
                  'python3 .promptscript/scripts/validate.py # promptscript-generated:validate',
                timeout: 30,
              },
            ],
          },
        ],
      },
    });
    expect(JSON.parse(result.outputs.get('.github/hooks/promptscript.json')!.content)).toEqual({
      version: 1,
      hooks: {
        preToolUse: [
          {
            type: 'command',
            bash: 'python3 .promptscript/scripts/validate.py # promptscript-generated:validate',
            powershell:
              "& 'python3' '.promptscript/scripts/validate.py' # promptscript-generated:validate",
            matcher: 'Edit|Write',
            timeoutSec: 30,
          },
        ],
      },
    });
  });
});
