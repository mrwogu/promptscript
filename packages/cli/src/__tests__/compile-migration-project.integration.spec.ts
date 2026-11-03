import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { parse } from 'yaml';
import { compileCommand } from '../commands/compile.js';

/**
 * A project shaped like a real migration: many droids and skills with script
 * and template resources, commands, hooks and settings for Factory and Claude,
 * app prompts in a bundle, and three builds with their own output directories.
 * All names are made up (com.example).
 */

const SKILL_COUNT = 36;
const FILLER_AGENT_COUNT = 12;

// Odd spacing on purpose: a copy that goes through Prettier or gets a marker would change it.
const PY_RESOURCE = 'import sys\r\n\r\nprint(  "keep   spacing"  )\r\n';
const J2_RESOURCE = '{% for row in rows %}\n|{{ row.a }}|  {{ row.b }}|\n{% endfor %}\n*   item\n';
const MD_RESOURCE = '# Guide\n\n|a|b|\n|---|---|\n|1|2|\n\n*   item\n';

const TABLE_ROW = '| `a\\|b` | -- | x |';
const MERMAID_NODE = 'A{{"x"}} --> B';

const directories: string[] = [];

interface ProjectOptions {
  postFormat?: boolean;
}

async function put(directory: string, path: string, content: string): Promise<void> {
  const file = join(directory, path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, content);
}

function config(options: ProjectOptions): string {
  return `version: '1'
project:
  id: com-example-migration
input:
  entry: .promptscript/project.prs
includePromptScriptSkill: false
output:
  markers: static
  manifest: true
${options.postFormat === false ? 'formatting:\n  postFormat: false\n' : ''}builds:
  factory:
    entry: .promptscript/project.prs
    output: runtime/factory
    targets:
      - factory:
          version: full
          hooksFile: hooks.json
          settings:
            model: custom:example-model
            enabledPlugins:
              code-standards@example-plugins: true
  claude:
    entry: .promptscript/project.prs
    output: runtime/claude
    targets:
      - claude:
          version: full
          excludeAgents: [orchestrator]
          settings:
            model: claude-sonnet-4-5
            permissions:
              allow:
                - 'Bash(npm run test:*)'
              deny:
                - 'Read(./.env)'
            enabledPlugins:
              code-standards@example-plugins: true
  prompts:
    entry: .promptscript/project.prs
    output: runtime/prompts
    targets:
      - bundle
`;
}

const PROJECT_PRS = `@meta {
  id: "com-example-migration"
  syntax: "1.6.0"
}

@use ./fragments/billing
@use ./fragments/reporting

@identity {
  """
  You maintain the com.example migration.
  """
}

@context {
  @header "Project context"
  """
  ## Overview
  Code lives in services/*, gateways/*.

  ### Diagram
  Flow: ${MERMAID_NODE}

  ## Rules
  Keep the steps small.
  """
}

@agents {
  orchestrator: {
    description: "Coordinates the other droids"
    tools: ["Read", "Task", "Create"]
    content: "Split the work and hand it out."
  }
  builder: {
    description: "Builds features"
    tools: ["Read", "Grep", "Create", "Execute", "FetchUrl", "ApplyPatch"]
    targets: {
      claude: {
        tools: ["Read", "Grep", "Write", "Bash(npm run build)"]
      }
    }
    content: "Implement the change. Hook: {{prs.dotDir}}/hooks."
  }
}

@hooks {
  guard-edits: {
    event: "pre-tool-use"
    matcher: "Edit|Write|Create"
    script: {
      path: ".promptscript/scripts/guard.mjs"
      interpreter: "node"
    }
    cwd: "project"
  }
  check-edits: {
    event: "post-tool-use"
    matcher: "Edit|Write|Create"
    command: ["node", ".promptscript/scripts/check.mjs"]
    cwd: "project"
  }
}

@prompts {
  welcome: {
    description: "Greet a new customer"
    system: "You answer for com.example."
    user: "Hello {{input.name}}"
    inputs: { name: { type: "string", description: "Customer name" } }
  }
  refund: {
    description: "Answer a refund request"
    system: "You handle refunds for com.example."
    user: "{{input.message}}"
    inputs: { message: { type: "string", description: "Customer message" } }
  }
}
`;

function fragment(id: string, skill: string): string {
  return `@meta {
  id: "${id}"
  syntax: "1.6.0"
}

@skills {
  ${skill}: {
    description: "${skill} from the ${id} fragment"
  }
}
`;
}

function nativeAgent(name: string, tools: string): string {
  return `---
name: ${name}
description: >-
  Works on one part of the ${name} migration.
  Produces: a short report.
tools: ${tools}
model: inherit
---

Do the ${name} work. Config is in {{prs.dotDir}}/settings.json.
`;
}

function nativeSkill(name: string, description: string, body: string): string {
  return `---
name: ${name}
description: ${description}
---

${body}
`;
}

async function writeSkill(
  directory: string,
  name: string,
  description: string,
  body: string
): Promise<void> {
  const skill = `.promptscript/skills/${name}`;
  await put(directory, `${skill}/SKILL.md`, nativeSkill(name, description, body));
  await put(directory, `${skill}/scripts/run.py`, PY_RESOURCE);
  await put(directory, `${skill}/templates/report.j2`, J2_RESOURCE);
  await put(directory, `${skill}/references/guide.md`, MD_RESOURCE);
}

/** A settings file the user already has. Compiling must keep these keys. */
async function seedUserSettings(directory: string): Promise<void> {
  const settings = {
    theme: 'dark',
    env: { OWN_VAR: '1' },
    permissions: { defaultMode: 'acceptEdits' },
  };
  await put(
    directory,
    'runtime/claude/.claude/settings.json',
    `${JSON.stringify(settings, null, 2)}\n`
  );
}

async function createProject(options: ProjectOptions = {}): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'promptscript-migration-'));
  directories.push(directory);

  await put(directory, 'promptscript.yaml', config(options));
  await put(directory, '.promptscript/project.prs', PROJECT_PRS);
  await put(directory, '.promptscript/fragments/billing.prs', fragment('billing', 'billing-skill'));
  await put(
    directory,
    '.promptscript/fragments/reporting.prs',
    fragment('reporting', 'reporting-skill')
  );
  await put(directory, '.promptscript/scripts/guard.mjs', 'process.exit(0);\n');
  await put(directory, '.promptscript/scripts/check.mjs', 'process.exit(0);\n');

  // Skills found in .promptscript/skills, no declaration needed.
  for (let i = 1; i <= SKILL_COUNT; i++) {
    const name = `skill-${String(i).padStart(2, '0')}`;
    await writeSkill(
      directory,
      name,
      `Does step ${i}`,
      `Run ${'{{prs.skillDir}}'}/scripts/run.py.`
    );
  }
  // Folded description with a line that starts with `Word:`.
  await writeSkill(
    directory,
    'spec-check',
    '>-\n  Checks a module against its spec.\n  Produces: a pass or fail table.',
    `| Name | Value | Note |
|------|-------|------|
${TABLE_ROW}
| plain | - | y |

- one
  - nested
- two

Use \`${'{{prs.skillDir}}'}/templates/report.j2\`.`
  );
  // Declared in the fragments and found on disk. The .prs description must win.
  await writeSkill(directory, 'billing-skill', 'Description from SKILL.md', 'Bill the customer.');
  await writeSkill(directory, 'reporting-skill', 'Another SKILL.md description', 'Report it.');

  await put(
    directory,
    '.promptscript/agents/auditor.md',
    nativeAgent('auditor', 'Read, Grep, Execute, Create')
  );
  await put(
    directory,
    '.promptscript/agents/migrator.md',
    `---
name: migrator
description: >-
  Moves one module to the new layout.
  Use when: the plan is approved.
tools:
  - Read
  - FetchUrl
  - ApplyPatch
---

Move the module.
`
  );
  await put(
    directory,
    '.promptscript/agents/scribe.md',
    nativeAgent('scribe', 'Read, Edit, WebSearch')
  );
  for (let i = 1; i <= FILLER_AGENT_COUNT; i++) {
    const name = `helper-${String(i).padStart(2, '0')}`;
    await put(directory, `.promptscript/agents/${name}.md`, nativeAgent(name, 'Read, Grep'));
  }

  await put(
    directory,
    '.promptscript/commands/deploy.md',
    `---
description: >-
  Deploy one environment.
  Produces: a deploy log
argument-hint: "[env]"
---

Deploy $ARGUMENTS.
`
  );
  await put(
    directory,
    '.promptscript/commands/review.md',
    `---
description: Review the open changes
argument-hint: <module> [--strict]
---

Review $ARGUMENTS.
`
  );

  await seedUserSettings(directory);
  return directory;
}

async function compile(
  directory: string,
  options: { check?: boolean; build?: string } = {}
): Promise<number | undefined> {
  process.exitCode = undefined;
  await compileCommand({ cwd: directory, allBuilds: options.build === undefined, ...options });
  const code = process.exitCode;
  process.exitCode = undefined;
  return code as number | undefined;
}

const SOURCE_PATHS = new Set(['promptscript.yaml', '.promptscript']);

/** Every generated file under the output directories, by relative path. */
async function snapshot(directory: string): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  const walk = async (current: string): Promise<void> => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      const rel = relative(directory, path);
      if (SOURCE_PATHS.has(rel)) continue;
      if (entry.isDirectory()) await walk(path);
      else files.set(rel, await readFile(path, 'utf-8'));
    }
  };
  await walk(directory);
  return files;
}

function frontmatterOf(content: string): string {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(content);
  if (!match) throw new Error('No frontmatter found');
  return match[1]!;
}

async function frontmatter(directory: string, file: string): Promise<Record<string, unknown>> {
  return parse(frontmatterOf(await readFile(join(directory, file), 'utf-8'))) as Record<
    string,
    unknown
  >;
}

async function readJson(directory: string, file: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(join(directory, file), 'utf-8')) as Record<string, unknown>;
}

beforeEach(() => {
  process.exitCode = undefined;
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

afterAll(async () => {
  for (const directory of directories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
});

describe.each([
  { name: 'postFormat: false', postFormat: false },
  { name: 'default formatting', postFormat: undefined },
])('migration project with $name', ({ postFormat }) => {
  let directory = '';
  let seconds = 0;
  let firstExitCode: number | undefined;
  let files: Map<string, string>;

  beforeAll(async () => {
    process.exitCode = undefined;
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    directory = await createProject({ postFormat });
    const started = Date.now();
    firstExitCode = await compile(directory);
    seconds = (Date.now() - started) / 1000;
    files = await snapshot(directory);
    vi.restoreAllMocks();
  });

  it('compiles all three builds without errors', () => {
    expect(firstExitCode).toBeUndefined();
    expect(existsSync(join(directory, 'runtime/factory/.factory/droids/auditor.md'))).toBe(true);
    expect(existsSync(join(directory, 'runtime/claude/.claude/agents/auditor.md'))).toBe(true);
    expect(existsSync(join(directory, 'runtime/prompts/prompts/index.json'))).toBe(true);
  });

  it('compiles about 200 files in seconds, not minutes', () => {
    expect(files.size).toBeGreaterThan(200);
    expect(seconds).toBeLessThan(60);
  });

  it('writes valid YAML frontmatter in every generated markdown file', () => {
    let checked = 0;
    for (const [path, content] of files) {
      if (!path.endsWith('.md') || !content.startsWith('---\n')) continue;
      expect(() => parse(frontmatterOf(content)), path).not.toThrow();
      checked++;
    }
    expect(checked).toBeGreaterThan(80);
  });

  it('keeps folded descriptions as one line with the colon text', async () => {
    const droid = await frontmatter(directory, 'runtime/factory/.factory/droids/migrator.md');
    expect(droid['description']).toBe(
      'Moves one module to the new layout. Use when: the plan is approved.'
    );
    const skill = await frontmatter(directory, 'runtime/claude/.claude/skills/spec-check/SKILL.md');
    expect(skill['description']).toBe(
      'Checks a module against its spec. Produces: a pass or fail table.'
    );
  });

  it('writes explicit tools in the vocabulary of each target', async () => {
    const factoryAuditor = await frontmatter(
      directory,
      'runtime/factory/.factory/droids/auditor.md'
    );
    expect(factoryAuditor['tools']).toEqual(['Read', 'Grep', 'Execute', 'Create']);
    const claudeAuditor = await frontmatter(directory, 'runtime/claude/.claude/agents/auditor.md');
    expect(claudeAuditor['tools']).toEqual(['Read', 'Grep', 'Bash', 'Write']);

    const factoryMigrator = await frontmatter(
      directory,
      'runtime/factory/.factory/droids/migrator.md'
    );
    expect(factoryMigrator['tools']).toEqual(['Read', 'FetchUrl', 'ApplyPatch']);
    const claudeMigrator = await frontmatter(
      directory,
      'runtime/claude/.claude/agents/migrator.md'
    );
    expect(claudeMigrator['tools']).toEqual(['Read', 'WebFetch', 'Edit']);
  });

  it('uses the per-target tools override and keeps parentheses in one tool', async () => {
    const factoryBuilder = await frontmatter(
      directory,
      'runtime/factory/.factory/droids/builder.md'
    );
    expect(factoryBuilder['tools']).toEqual([
      'Read',
      'Grep',
      'Create',
      'Execute',
      'FetchUrl',
      'ApplyPatch',
    ]);
    const claudeBuilder = await frontmatter(directory, 'runtime/claude/.claude/agents/builder.md');
    expect(claudeBuilder['tools']).toEqual(['Read', 'Grep', 'Write', 'Bash(npm run build)']);
  });

  it('leaves the Task agent out of claude and keeps it for factory', async () => {
    expect(existsSync(join(directory, 'runtime/claude/.claude/agents/orchestrator.md'))).toBe(
      false
    );
    const droid = await frontmatter(directory, 'runtime/factory/.factory/droids/orchestrator.md');
    expect(droid['tools']).toEqual(['Read', 'Task', 'Create']);
  });

  it('writes every agent for factory and all but one for claude', () => {
    const droids = [...files.keys()].filter((p) =>
      /^runtime\/factory\/\.factory\/droids\/[^/]+\.md$/.test(p)
    );
    const agents = [...files.keys()].filter((p) =>
      /^runtime\/claude\/\.claude\/agents\/[^/]+\.md$/.test(p)
    );
    expect(droids).toHaveLength(FILLER_AGENT_COUNT + 5);
    expect(agents).toHaveLength(FILLER_AGENT_COUNT + 4);
  });

  it('has no .factory path in the claude output', () => {
    for (const [path, content] of files) {
      if (!path.startsWith('runtime/claude/')) continue;
      expect(content.includes('.factory'), path).toBe(false);
    }
  });

  it('resolves path tokens for each target', async () => {
    const claudeSkill = await readFile(
      join(directory, 'runtime/claude/.claude/skills/skill-01/SKILL.md'),
      'utf-8'
    );
    const factorySkill = await readFile(
      join(directory, 'runtime/factory/.factory/skills/skill-01/SKILL.md'),
      'utf-8'
    );
    expect(claudeSkill).toContain('.claude/skills/skill-01/scripts/run.py');
    expect(factorySkill).toContain('.factory/skills/skill-01/scripts/run.py');
    const builder = await readFile(
      join(directory, 'runtime/factory/.factory/droids/builder.md'),
      'utf-8'
    );
    expect(builder).toContain('.factory/hooks');
  });

  it('copies skill scripts and templates byte for byte', async () => {
    for (const root of ['runtime/factory/.factory/skills', 'runtime/claude/.claude/skills']) {
      for (const name of ['skill-01', 'skill-36', 'spec-check', 'billing-skill']) {
        const read = (file: string): Promise<string> =>
          readFile(join(directory, root, name, file), 'utf-8');
        expect(await read('scripts/run.py'), `${root}/${name}`).toBe(PY_RESOURCE);
        expect(await read('templates/report.j2'), `${root}/${name}`).toBe(J2_RESOURCE);
      }
    }
  });

  it('keeps the text of reference files and only adds the provenance line', async () => {
    for (const root of ['runtime/factory/.factory/skills', 'runtime/claude/.claude/skills']) {
      const reference = await readFile(
        join(directory, root, 'skill-01/references/guide.md'),
        'utf-8'
      );
      expect(reference, root).toMatch(/^<!-- from: [^\n]+ -->\n\n/);
      expect(reference.replace(/^<!-- from: [^\n]+ -->\n\n/, ''), root).toBe(MD_RESOURCE);
    }
  });

  it('merges skills declared in fragments once and lets the .prs description win', async () => {
    expect(firstExitCode).toBeUndefined();
    const billing = await frontmatter(
      directory,
      'runtime/claude/.claude/skills/billing-skill/SKILL.md'
    );
    expect(billing['description']).toBe('billing-skill from the billing fragment');
    const reporting = await frontmatter(
      directory,
      'runtime/factory/.factory/skills/reporting-skill/SKILL.md'
    );
    expect(reporting['description']).toBe('reporting-skill from the reporting fragment');
  });

  it('writes the commands with argument-hint', async () => {
    for (const root of ['runtime/factory/.factory/commands', 'runtime/claude/.claude/commands']) {
      const deploy = await frontmatter(directory, `${root}/deploy.md`);
      expect(deploy['argument-hint']).toBe('[env]');
      expect(deploy['description']).toBe('Deploy one environment. Produces: a deploy log');
      const review = await frontmatter(directory, `${root}/review.md`);
      expect(review['argument-hint']).toBe('<module> [--strict]');
    }
  });

  it('writes Factory hooks.json as a bare event map', async () => {
    const hooks = await readJson(directory, 'runtime/factory/.factory/hooks.json');
    expect(hooks['hooks']).toBeUndefined();
    expect(Object.keys(hooks).sort()).toEqual(['PostToolUse', 'PreToolUse']);
    expect(Array.isArray(hooks['PreToolUse'])).toBe(true);
  });

  it('writes the Claude hooks into settings.json', async () => {
    const settings = await readJson(directory, 'runtime/claude/.claude/settings.json');
    const hooks = settings['hooks'] as Record<string, unknown>;
    expect(Object.keys(hooks).sort()).toEqual(['PostToolUse', 'PreToolUse']);
  });

  it('writes the target settings and keeps the keys the user added', async () => {
    const claude = await readJson(directory, 'runtime/claude/.claude/settings.json');
    expect(claude['theme']).toBe('dark');
    expect(claude['env']).toEqual({ OWN_VAR: '1' });
    expect(claude['model']).toBe('claude-sonnet-4-5');
    expect(claude['permissions']).toEqual({
      defaultMode: 'acceptEdits',
      allow: ['Bash(npm run test:*)'],
      deny: ['Read(./.env)'],
    });
    expect(claude['enabledPlugins']).toEqual({ 'code-standards@example-plugins': true });

    const factory = await readJson(directory, 'runtime/factory/.factory/settings.json');
    expect(factory['model']).toBe('custom:example-model');
    expect(factory['enabledPlugins']).toEqual({ 'code-standards@example-plugins': true });
    expect(factory['permissions']).toBeUndefined();
  });

  it('writes the prompts bundle', async () => {
    const index = await readJson(directory, 'runtime/prompts/prompts/index.json');
    expect(JSON.stringify(index)).toContain('welcome');
    expect(JSON.stringify(index)).toContain('refund');
  });

  it('keeps tables, code spans, nested lists and the Mermaid node', async () => {
    for (const root of ['runtime/factory/.factory/skills', 'runtime/claude/.claude/skills']) {
      const skill = await readFile(join(directory, root, 'spec-check/SKILL.md'), 'utf-8');
      const rows = skill.split('\n').filter((line) => line.startsWith('|'));
      // Cells are compared without padding: Prettier may pad them, never change them.
      const cells = rows.map((row) =>
        row
          .split(/(?<!\\)\|/)
          .slice(1, -1)
          .map((cell) => cell.trim())
      );
      expect(cells[0]).toEqual(['Name', 'Value', 'Note']);
      expect(cells[2]).toEqual(['`a\\|b`', '--', 'x']);
      expect(cells[3]).toEqual(['plain', '-', 'y']);
      expect(skill).toMatch(/^- one\n {2}- nested\n- two$/m);
    }
    for (const file of ['runtime/claude/CLAUDE.md', 'runtime/factory/AGENTS.md']) {
      const text = await readFile(join(directory, file), 'utf-8');
      expect(text, file).toContain(MERMAID_NODE);
      // Kept as written without post format, escaped (never turned into emphasis) with it.
      expect(text, file).toContain(
        postFormat === false ? 'services/*, gateways/*' : 'services/\\*, gateways/\\*'
      );
    }
  });

  it('keeps the relative heading levels of @context', async () => {
    for (const file of ['runtime/claude/CLAUDE.md', 'runtime/factory/AGENTS.md']) {
      const text = await readFile(join(directory, file), 'utf-8');
      const level = (title: string): number => {
        const match = new RegExp(`^(#+) ${title}$`, 'm').exec(text);
        if (!match) throw new Error(`${file} has no heading ${title}`);
        return match[1]!.length;
      };
      expect(level('Diagram'), file).toBe(level('Overview') + 1);
      expect(level('Rules'), file).toBe(level('Overview'));
    }
  });

  it('gives byte-identical output for a second compile into empty directories', async () => {
    const before = await snapshot(directory);
    await rm(join(directory, 'runtime'), { recursive: true });
    await seedUserSettings(directory);
    expect(await compile(directory)).toBeUndefined();
    const after = await snapshot(directory);
    expect([...after.keys()].sort()).toEqual([...before.keys()].sort());
    for (const [path, content] of before) {
      expect(after.get(path), path).toBe(content);
    }
  });

  it('removes the files of a removed skill on the next compile', async () => {
    await rm(join(directory, '.promptscript/skills/skill-02'), { recursive: true });
    expect(await compile(directory)).toBeUndefined();
    for (const root of ['runtime/factory/.factory/skills', 'runtime/claude/.claude/skills']) {
      expect(existsSync(join(directory, root, 'skill-02')), root).toBe(false);
      expect(existsSync(join(directory, root, 'skill-03/SKILL.md')), root).toBe(true);
    }
  });

  it('exits 0 for --check when clean and 1 after an edit of a generated file or a source', async () => {
    expect(await compile(directory)).toBeUndefined();
    expect(await compile(directory, { check: true })).toBeUndefined();

    const generated = join(directory, 'runtime/claude/.claude/agents/auditor.md');
    const original = await readFile(generated, 'utf-8');
    await writeFile(generated, `${original}\nEdited by hand.\n`);
    expect(await compile(directory, { check: true })).toBe(1);
    await writeFile(generated, original);
    expect(await compile(directory, { check: true })).toBeUndefined();

    const source = join(directory, '.promptscript/agents/scribe.md');
    const sourceText = await readFile(source, 'utf-8');
    await writeFile(source, sourceText.replace('Do the scribe work.', 'Do other work.'));
    expect(await compile(directory, { check: true })).toBe(1);
    await writeFile(source, sourceText);
    expect(await compile(directory, { check: true })).toBeUndefined();
  });
});
