import { describe, it, expect } from 'vitest';
import { TARGET_DEFINITIONS } from '@promptscript/core';
import type { KnownTarget, Program } from '@promptscript/core';
// Import from index to trigger built-in formatter registration
import { FormatterRegistry } from '../index.js';
import type { Formatter, FormatterOutput } from '../types.js';

/**
 * Complete inventory of expected skill paths for all known target formatters.
 * Source of truth: docs/superpowers/specs/2026-03-13-auto-inject-promptscript-skill-design.md
 */
const EXPECTED_SKILL_PATHS: Record<string, { basePath: string | null; fileName: string | null }> = {
  // BaseFormatter subclasses
  claude: { basePath: '.claude/skills', fileName: 'SKILL.md' },
  github: { basePath: '.github/skills', fileName: 'SKILL.md' },
  cursor: { basePath: '.agents/skills', fileName: 'SKILL.md' },
  antigravity: { basePath: null, fileName: null },
  // MarkdownInstructionFormatter subclasses (hasSkills: false targets return null)
  adal: { basePath: '.adal/skills', fileName: 'SKILL.md' },
  amp: { basePath: '.agents/skills', fileName: 'SKILL.md' },
  augment: { basePath: null, fileName: null },
  cline: { basePath: null, fileName: null },
  codebuddy: { basePath: '.codebuddy/skills', fileName: 'SKILL.md' },
  codex: { basePath: '.agents/skills', fileName: 'SKILL.md' },
  'command-code': { basePath: '.commandcode/skills', fileName: 'SKILL.md' },
  continue: { basePath: null, fileName: null },
  cortex: { basePath: '.cortex/skills', fileName: 'SKILL.md' },
  crush: { basePath: '.crush/skills', fileName: 'SKILL.md' },
  factory: { basePath: '.factory/skills', fileName: 'SKILL.md' },
  gemini: { basePath: '.gemini/skills', fileName: 'skill.md' },
  goose: { basePath: '.goose/skills', fileName: 'SKILL.md' },
  iflow: { basePath: '.iflow/skills', fileName: 'SKILL.md' },
  junie: { basePath: '.junie/skills', fileName: 'SKILL.md' },
  kilo: { basePath: '.kilocode/skills', fileName: 'SKILL.md' },
  kiro: { basePath: '.kiro/skills', fileName: 'SKILL.md' },
  kode: { basePath: '.kode/skills', fileName: 'SKILL.md' },
  mcpjam: { basePath: '.mcpjam/skills', fileName: 'SKILL.md' },
  'mistral-vibe': { basePath: '.vibe/skills', fileName: 'SKILL.md' },
  mux: { basePath: null, fileName: null },
  neovate: { basePath: null, fileName: null },
  openclaw: { basePath: '.openclaw/skills', fileName: 'SKILL.md' },
  opencode: { basePath: '.opencode/skills', fileName: 'SKILL.md' },
  openhands: { basePath: '.openhands/skills', fileName: 'SKILL.md' },
  pi: { basePath: '.pi/skills', fileName: 'SKILL.md' },
  pochi: { basePath: '.pochi/skills', fileName: 'SKILL.md' },
  qoder: { basePath: null, fileName: null },
  'qwen-code': { basePath: '.qwen/skills', fileName: 'SKILL.md' },
  roo: { basePath: null, fileName: null },
  trae: { basePath: '.trae/skills', fileName: 'SKILL.md' },
  windsurf: { basePath: '.windsurf/skills', fileName: 'SKILL.md' },
  zencoder: { basePath: '.zencoder/skills', fileName: 'SKILL.md' },
  // AGENTS.md-only targets (no skill support)
  aider: { basePath: null, fileName: null },
  'amazon-q': { basePath: null, fileName: null },
  warp: { basePath: null, fileName: null },
  zed: { basePath: null, fileName: null },
  jules: { basePath: null, fileName: null },
  devin: { basePath: null, fileName: null },
  grok: { basePath: '.claude/skills', fileName: 'SKILL.md' },
  // Priority B CLI agents (AGENTS.md-only, no skills by default)
  kimi: { basePath: null, fileName: null },
  mimo: { basePath: null, fileName: null },
  'deep-agents': { basePath: null, fileName: null },
  forgecode: { basePath: null, fileName: null },
  hermes: { basePath: null, fileName: null },
};

describe('Skill path inventory verification', () => {
  const registeredNames = FormatterRegistry.list();

  it('should have entries for all registered formatters', () => {
    for (const name of registeredNames) {
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

    for (const version of supportedVersions(formatter)) {
      let output: FormatterOutput;
      try {
        output = formatter.format(programWithSkill(), version ? { version } : undefined);
      } catch {
        // Versions that reject this input cannot emit skill files either.
        continue;
      }
      for (const path of collectPaths(output)) {
        if (SKILL_FILE_PATTERN.test(path)) emitted.add(path);
      }
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
