import { describe, it, expect } from 'vitest';
import { KNOWN_TARGETS, TARGET_DEFINITIONS } from '@promptscript/core';
import type { KnownTarget, Program } from '@promptscript/core';
// Import from index to trigger built-in formatter registration
import { FormatterRegistry } from '../index.js';
import type { Formatter, FormatterOutput } from '../types.js';

/**
 * Expected skill paths projected from the canonical target capability contract.
 */
const EXPECTED_SKILL_PATHS = Object.fromEntries(
  Object.entries(TARGET_DEFINITIONS).map(([name, definition]) => [name, definition.skillPath])
) as Record<KnownTarget, { basePath: string | null; fileName: string | null }>;

describe('Skill path inventory verification', () => {
  const registeredNames = FormatterRegistry.list();

  it('should have entries for all known targets', () => {
    for (const name of KNOWN_TARGETS) {
      expect(EXPECTED_SKILL_PATHS).toHaveProperty(name);
    }
  });

  it('should not have stale entries for unregistered formatters', () => {
    for (const name of Object.keys(EXPECTED_SKILL_PATHS)) {
      expect(registeredNames).toContain(name);
    }
  });

  it.each(
    Object.entries(EXPECTED_SKILL_PATHS).map(([name, paths]) => ({
      name,
      basePath: paths.basePath,
      fileName: paths.fileName,
    }))
  )(
    '$name: getSkillBasePath() = $basePath, getSkillFileName() = $fileName',
    ({ name, basePath, fileName }) => {
      const formatter = FormatterRegistry.get(name);
      expect(formatter).toBeDefined();
      expect(formatter!.getSkillBasePath()).toBe(basePath);
      expect(formatter!.getSkillFileName()).toBe(fileName);
    }
  );
});

/**
 * The catalog in @promptscript/core declares skill paths independently of the
 * formatters that emit them. These checks keep the two from drifting apart.
 */
describe('Target catalog skill metadata', () => {
  const registeredNames = FormatterRegistry.list();

  it.each(registeredNames)('%s: catalog matches the formatter', (name) => {
    const formatter = FormatterRegistry.get(name)!;
    const definition = TARGET_DEFINITIONS[name as KnownTarget];

    expect(definition).toBeDefined();
    expect(definition.skillPath.basePath).toBe(formatter.getSkillBasePath());
    expect(definition.skillPath.fileName).toBe(formatter.getSkillFileName());
    expect(definition.features.hasSkills).toBe(formatter.getSkillBasePath() !== null);
    const capabilities = formatterCapabilities(formatter);
    expect(definition.features.hasAgents).toBe(capabilities.hasAgents);
    expect(definition.features.hasCommands).toBe(capabilities.hasCommands);
  });
});

const SKILL_FILE_PATTERN = /(^|\/)skill\.md$/i;

function collectPaths(output: FormatterOutput): string[] {
  const paths = [output.path];
  const queue = [...(output.additionalFiles ?? [])];
  while (queue.length > 0) {
    const file = queue.shift()!;
    paths.push(file.path);
    if (file.additionalFiles) queue.push(...file.additionalFiles);
  }
  return paths;
}

function supportedVersions(formatter: Formatter): Array<string | undefined> {
  const ctor: unknown = (formatter as { constructor?: unknown }).constructor;
  if (typeof ctor === 'function') {
    const accessor = (ctor as { getSupportedVersions?: unknown }).getSupportedVersions;
    if (typeof accessor === 'function') {
      const versions: unknown = accessor.call(ctor);
      if (versions && typeof versions === 'object') {
        return [undefined, ...Object.keys(versions)];
      }
    }
  }
  return [undefined];
}

function programWithSkill(): Program {
  const loc = { file: 'test.prs', line: 1, column: 1 };
  return {
    type: 'Program',
    uses: [],
    extends: [],
    loc,
    blocks: [
      {
        type: 'Block',
        name: 'skills',
        content: {
          type: 'ObjectContent',
          properties: {
            'inventory-probe': {
              description: 'Skill used to verify emitted skill paths',
              content: 'Probe body.',
            },
          },
          loc,
        },
        loc,
      },
    ],
  } as Program;
}

interface FormatterCapabilities {
  hasAgents: boolean;
  hasCommands: boolean;
}

/**
 * Formatter exposes skill paths, but not agent or command capability flags.
 * Probe supported versions to derive those flags from emitted file contracts.
 */
function formatterCapabilities(formatter: Formatter): FormatterCapabilities {
  const paths: string[] = [];
  for (const version of supportedVersions(formatter)) {
    const output = formatter.format(programWithCapabilities(), version ? { version } : undefined);
    paths.push(...collectPaths(output));
  }

  return {
    hasAgents: hasFileWithStem(paths, 'capability-agent'),
    hasCommands: hasFileWithStem(paths, 'capability-command'),
  };
}

function hasFileWithStem(paths: readonly string[], stem: string): boolean {
  return paths.some((path) => {
    const fileName = path.split('/').pop() ?? '';
    return fileName.startsWith(`${stem}.`);
  });
}

function programWithCapabilities(): Program {
  const loc = { file: 'test.prs', line: 1, column: 1 };
  return {
    type: 'Program',
    uses: [],
    extends: [],
    loc,
    blocks: [
      {
        type: 'Block',
        name: 'shortcuts',
        content: {
          type: 'ObjectContent',
          properties: {
            'capability-command': {
              description: 'Command used to verify formatter capabilities',
              prompt: true,
              content: 'Run the capability probe.',
            },
          },
          loc,
        },
        loc,
      },
      {
        type: 'Block',
        name: 'agents',
        content: {
          type: 'ObjectContent',
          properties: {
            'capability-agent': {
              description: 'Agent used to verify formatter capabilities',
              content: 'Run the capability probe.',
            },
          },
          loc,
        },
        loc,
      },
    ],
  } as Program;
}

/**
 * A formatter that writes skill files must declare where it writes them,
 * otherwise the catalog, `prs init` scaffolding and the auto-injected
 * PromptScript skill all target the wrong directory.
 */
describe('Emitted skill paths', () => {
  it.each(FormatterRegistry.list())('%s: emits skill files under its base path', (name) => {
    const formatter = FormatterRegistry.get(name)!;
    const declaredBase = formatter.getSkillBasePath();
    const emitted = new Set<string>();
    const errors: string[] = [];

    for (const version of supportedVersions(formatter)) {
      let output: FormatterOutput;
      try {
        output = formatter.format(programWithSkill(), version ? { version } : undefined);
      } catch (error: unknown) {
        errors.push(
          `${version ?? 'default'}: ${error instanceof Error ? error.message : String(error)}`
        );
        continue;
      }
      for (const path of collectPaths(output)) {
        if (SKILL_FILE_PATTERN.test(path)) emitted.add(path);
      }
    }

    if (declaredBase !== null) {
      expect(errors, `${name} failed while probing skill output`).toHaveLength(0);
      expect(
        emitted.size,
        `${name} declared skill support but emitted no skill files`
      ).toBeGreaterThan(0);
    }

    for (const path of emitted) {
      expect(declaredBase, `${name} emits ${path} but declares no skill base path`).not.toBeNull();
      expect(
        path.startsWith(`${declaredBase}/`),
        `${name} emits ${path} outside ${declaredBase}`
      ).toBe(true);
    }
  });
});
