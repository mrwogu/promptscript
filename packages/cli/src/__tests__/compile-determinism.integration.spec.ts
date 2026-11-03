import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { lstat, mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { compileCommand } from '../commands/compile.js';

const directories: string[] = [];
let consoleLog: ReturnType<typeof vi.spyOn>;

// Formatting that Prettier would change: table padding and list markers.
const TEMPLATE = '# Report\n\n|a|b|\n|---|---|\n|1|2|\n\n*   item\n';
const SCRIPT = '#!/bin/sh\necho   "keep   spacing"\n';

function source(skills: string[], agents: string[]): string {
  const skillBlock = skills.map((name) => `  ${name}: {\n    description: "Skill ${name}"\n  }`);
  const agentBlock = agents.map(
    (name) => `  ${name}: {
    description: "Agent ${name}"
    content: """
      Review the code.
      * first
      * second
    """
  }`
  );
  return `@meta { id: "determinism" syntax: "1.6.0" }

@identity {
  """
  You are a helper.
  """
}
${skillBlock.length > 0 ? `\n@skills {\n${skillBlock.join('\n')}\n}\n` : ''}${
    agentBlock.length > 0 ? `\n@agents {\n${agentBlock.join('\n')}\n}\n` : ''
  }`;
}

async function writeSkill(directory: string, name: string): Promise<void> {
  const skill = join(directory, '.promptscript', 'skills', name);
  await mkdir(join(skill, 'templates'), { recursive: true });
  await mkdir(join(skill, 'scripts'), { recursive: true });
  await writeFile(
    join(skill, 'SKILL.md'),
    `---\nname: ${name}\ndescription: Skill ${name}\n---\n\nUse the template.\n`
  );
  await writeFile(join(skill, 'templates', 'report.md'), TEMPLATE);
  await writeFile(join(skill, 'scripts', 'run.sh'), SCRIPT);
}

async function project(config: string, skills = ['alpha'], agents = ['reviewer']): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'promptscript-determinism-'));
  directories.push(directory);
  await mkdir(join(directory, '.promptscript'), { recursive: true });
  await writeFile(
    join(directory, 'promptscript.yaml'),
    `version: '1'
targets:
  - claude
  - factory
includePromptScriptSkill: false
${config}`
  );
  for (const skill of skills) await writeSkill(directory, skill);
  await writeFile(join(directory, '.promptscript', 'project.prs'), source(skills, agents));
  return directory;
}

async function setSource(directory: string, skills: string[], agents: string[]): Promise<void> {
  // Skills in .promptscript/skills are found without a declaration, so a
  // removed skill loses its directory too.
  const skillsRoot = join(directory, '.promptscript', 'skills');
  for (const entry of existsSync(skillsRoot) ? await readdir(skillsRoot) : []) {
    if (!skills.includes(entry)) await rm(join(skillsRoot, entry), { recursive: true });
  }
  await writeFile(join(directory, '.promptscript', 'project.prs'), source(skills, agents));
}

async function compile(directory: string, options: { check?: boolean; target?: string } = {}) {
  process.exitCode = undefined;
  await compileCommand({ cwd: directory, ...options });
  return process.exitCode;
}

/** Every generated file in the project, without the sources, by relative path. */
async function snapshot(directory: string): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  const walk = async (current: string): Promise<void> => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      const rel = relative(directory, path);
      if (rel === '.promptscript' || rel === 'promptscript.yaml') continue;
      if (entry.isDirectory()) await walk(path);
      else files.set(rel, await readFile(path, 'utf-8'));
    }
  };
  await walk(directory);
  return files;
}

async function removeGenerated(directory: string): Promise<void> {
  for (const entry of await readdir(directory)) {
    if (entry === '.promptscript' || entry === 'promptscript.yaml') continue;
    await rm(join(directory, entry), { recursive: true, force: true });
  }
}

function outputText(): string {
  const calls = consoleLog.mock.calls as unknown[][];
  return calls.flatMap((call) => call.map(String)).join('\n');
}

beforeEach(() => {
  process.exitCode = undefined;
  consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  process.exitCode = undefined;
  for (const directory of directories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
});

describe('compile output determinism', () => {
  it('gives byte-identical output for two compiles into an empty directory', async () => {
    const directory = await project('output:\n  markers: static\n  manifest: true\n');

    expect(await compile(directory)).toBeUndefined();
    const first = await snapshot(directory);
    await removeGenerated(directory);
    expect(await compile(directory)).toBeUndefined();
    const second = await snapshot(directory);

    expect([...second.keys()].sort()).toEqual([...first.keys()].sort());
    for (const [path, content] of first) {
      expect(second.get(path), path).toBe(content);
    }
    expect(first.get('CLAUDE.md')).toContain('<!-- PromptScript static | source:');
    expect(first.get('.claude/skills/alpha/SKILL.md')).toContain(
      '# promptscript-generated: static | source:'
    );
    expect(first.has('.promptscript-generated.json')).toBe(true);
  });

  it('uses SOURCE_DATE_EPOCH for timestamp markers', async () => {
    vi.stubEnv('SOURCE_DATE_EPOCH', '1700000000');
    const directory = await project('');

    await compile(directory);

    const claude = await readFile(join(directory, 'CLAUDE.md'), 'utf-8');
    expect(claude).toContain('<!-- PromptScript 2023-11-14T22:13:20.000Z | source:');
  });

  it('writes no marker with markers none and records ownership in the manifest', async () => {
    const directory = await project('output:\n  markers: none\n');

    expect(await compile(directory)).toBeUndefined();

    const files = await snapshot(directory);
    for (const [path, content] of files) {
      expect(content, path).not.toContain('PromptScript static');
      expect(content, path).not.toContain('promptscript-generated:');
      expect(content, path).not.toMatch(/<!-- PromptScript \d/);
    }
    const manifest = JSON.parse(files.get('.promptscript-generated.json') ?? '{}') as {
      files: Record<string, { target?: string }>;
    };
    expect(manifest.files['CLAUDE.md']?.target).toBe('claude');
    expect(manifest.files['.factory/skills/alpha/scripts/run.sh']?.target).toBe('factory');

    // The next compile overwrites files that have no marker but are in the manifest.
    await setSource(directory, ['alpha'], ['reviewer', 'helper']);
    await writeFile(
      join(directory, '.promptscript', 'skills', 'alpha', 'SKILL.md'),
      '---\nname: alpha\ndescription: Skill alpha\n---\n\nUse the new template.\n'
    );
    expect(await compile(directory)).toBeUndefined();
    expect(await readFile(join(directory, '.claude/skills/alpha/SKILL.md'), 'utf-8')).toContain(
      'Use the new template.'
    );
  });
});

describe('skill resource files', () => {
  it('copies templates and scripts byte for byte, without marker or Prettier', async () => {
    const directory = await project('');

    await compile(directory);

    for (const target of ['.claude', '.factory']) {
      const skill = join(directory, target, 'skills', 'alpha');
      expect(await readFile(join(skill, 'templates', 'report.md'), 'utf-8')).toBe(TEMPLATE);
      expect(await readFile(join(skill, 'scripts', 'run.sh'), 'utf-8')).toBe(SCRIPT);
      expect(await readFile(join(skill, 'SKILL.md'), 'utf-8')).toContain(
        '# promptscript-generated:'
      );
    }
  });

  it('updates a changed resource of its own skill without --force', async () => {
    const directory = await project('');
    await compile(directory);

    const changed = '# Report v2\n';
    await writeFile(
      join(directory, '.promptscript', 'skills', 'alpha', 'templates', 'report.md'),
      changed
    );
    expect(await compile(directory)).toBeUndefined();

    expect(
      await readFile(join(directory, '.claude/skills/alpha/templates/report.md'), 'utf-8')
    ).toBe(changed);
  });

  it('keeps agent bodies as written with formatting.postFormat false', async () => {
    const directory = await project('formatting:\n  postFormat: false\n');

    await compile(directory);

    const agent = await readFile(join(directory, '.claude/agents/reviewer.md'), 'utf-8');
    expect(agent).toContain('* first\n* second');
  });

  it('normalizes agent bodies for Prettier by default', async () => {
    const directory = await project('');

    await compile(directory);

    const agent = await readFile(join(directory, '.claude/agents/reviewer.md'), 'utf-8');
    expect(agent).toContain('- first\n- second');
  });
});

describe('stale generated files', () => {
  it('removes files of a removed skill and agent', async () => {
    const directory = await project('output:\n  manifest: true\n');
    await compile(directory);
    expect(existsSync(join(directory, '.claude/skills/alpha/scripts/run.sh'))).toBe(true);
    expect(existsSync(join(directory, '.factory/droids/reviewer.md'))).toBe(true);

    await setSource(directory, [], []);
    expect(await compile(directory)).toBeUndefined();

    for (const target of ['.claude', '.factory']) {
      expect(existsSync(join(directory, target, 'skills', 'alpha'))).toBe(false);
    }
    expect(existsSync(join(directory, '.claude/agents/reviewer.md'))).toBe(false);
    expect(existsSync(join(directory, '.factory/droids/reviewer.md'))).toBe(false);
    expect(existsSync(join(directory, 'CLAUDE.md'))).toBe(true);
    const manifest = await readFile(join(directory, '.promptscript-generated.json'), 'utf-8');
    expect(manifest).not.toContain('alpha');
    expect(manifest).not.toContain('reviewer');
  });

  it('keeps a stale file that was edited by hand and reports it', async () => {
    const directory = await project('output:\n  manifest: true\n');
    await compile(directory);
    const edited = join(directory, '.claude/skills/alpha/templates/report.md');
    await writeFile(edited, '# My own notes\n');

    await setSource(directory, [], ['reviewer']);
    await compile(directory);

    expect(await readFile(edited, 'utf-8')).toBe('# My own notes\n');
    expect(existsSync(join(directory, '.claude/skills/alpha/SKILL.md'))).toBe(false);
    expect(outputText()).toContain('Kept stale generated file');
    expect(await compile(directory, { check: true })).toBe(1);
  });

  it('keeps files of other targets when one target is compiled', async () => {
    const directory = await project('output:\n  manifest: true\n');
    await compile(directory);

    await compile(directory, { target: 'claude' });

    expect(existsSync(join(directory, '.factory/skills/alpha/SKILL.md'))).toBe(true);
    const manifest = await readFile(join(directory, '.promptscript-generated.json'), 'utf-8');
    expect(manifest).toContain('.factory/skills/alpha/SKILL.md');
  });

  it('does not write the manifest through a symbolic link', async () => {
    const directory = await project('output:\n  manifest: true\n');
    const elsewhere = join(directory, 'elsewhere.json');
    await writeFile(elsewhere, 'mine\n');
    await symlink(elsewhere, join(directory, '.promptscript-generated.json'));

    await compile(directory);

    expect((await lstat(join(directory, '.promptscript-generated.json'))).isSymbolicLink()).toBe(
      true
    );
    expect(await readFile(elsewhere, 'utf-8')).toBe('mine\n');
    expect(outputText()).toContain('it is a symbolic link');
  });

  it('leaves stale files alone without the manifest option', async () => {
    const directory = await project('');
    await compile(directory);

    await setSource(directory, [], []);
    await compile(directory);

    expect(existsSync(join(directory, '.promptscript-generated.json'))).toBe(false);
    expect(existsSync(join(directory, '.claude/skills/alpha/scripts/run.sh'))).toBe(true);
  });
});

describe('prs compile --check', () => {
  it('passes when the output is up to date and writes nothing', async () => {
    const directory = await project('output:\n  markers: static\n  manifest: true\n');
    await compile(directory);
    const before = await snapshot(directory);

    expect(await compile(directory, { check: true })).toBeUndefined();

    expect(await snapshot(directory)).toEqual(before);
    expect(outputText()).toContain('Generated files are up to date');
  });

  it('fails on a changed generated file without touching it', async () => {
    const directory = await project('output:\n  markers: static\n  manifest: true\n');
    await compile(directory);
    const claude = join(directory, 'CLAUDE.md');
    await writeFile(claude, 'edited\n');

    expect(await compile(directory, { check: true })).toBe(1);

    expect(await readFile(claude, 'utf-8')).toBe('edited\n');
  });

  it('fails on a missing generated file', async () => {
    const directory = await project('output:\n  markers: static\n');
    await compile(directory);
    await rm(join(directory, '.claude/skills/alpha/scripts/run.sh'));

    expect(await compile(directory, { check: true })).toBe(1);
    expect(existsSync(join(directory, '.claude/skills/alpha/scripts/run.sh'))).toBe(false);
  });

  it('fails on stale files and keeps them', async () => {
    const directory = await project('output:\n  markers: static\n  manifest: true\n');
    await compile(directory);
    await setSource(directory, [], []);

    expect(await compile(directory, { check: true })).toBe(1);

    expect(existsSync(join(directory, '.claude/skills/alpha/SKILL.md'))).toBe(true);
    expect(outputText()).toContain('Would remove stale generated file');
  });

  it('rewrites timestamp markers when the marker mode becomes static', async () => {
    const directory = await project('');
    await compile(directory);
    await writeFile(
      join(directory, 'promptscript.yaml'),
      `version: '1'
targets:
  - claude
  - factory
includePromptScriptSkill: false
output:
  markers: static
`
    );

    expect(await compile(directory, { check: true })).toBe(1);
    await compile(directory);

    expect(await readFile(join(directory, 'CLAUDE.md'), 'utf-8')).toContain(
      '<!-- PromptScript static |'
    );
    expect(await compile(directory, { check: true })).toBeUndefined();
  });
});
