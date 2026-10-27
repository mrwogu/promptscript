import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  governanceCodeownersCommand,
  type CodeownersOptions,
  type CodeownersReport,
} from './codeowners.js';
import { codeownersMarker } from './codeowners-file.js';

// Every test resolves a project in a fresh Git repository, which is slow on a loaded machine.
vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

const GOVERNANCE = `governance:
  admins: ['@acme/prompt-platform']
  roles:
    security: ['@acme/appsec']
    legal: ['@acme/legal', '@jane']
`;

const CONFIG = `id: support
syntax: 1.6.0
targets: []
${GOVERNANCE}`;

function prompts(meta: string, entries: string, head = ''): string {
  return `@meta {
  id: "acme-support"
  syntax: "1.6.0"
${meta}}
${head}
@prompts {
${entries}}
`;
}

const ENTRY = (name: string, extra = ''): string => `  ${name}: {
    description: "Answer a request"
${extra}    system: "You answer requests."
    user: "Hello"
  }
`;

const PROJECT = prompts(
  '  owner: "@acme/support"\n',
  ENTRY('refund-reply', '    reviewers: ["@acme/payments"]\n')
);

const ADMIN_LINES = [
  '/.promptscript/approvals @acme/prompt-platform',
  '/.promptscript/approvals/legal @acme/legal @jane',
  '/.promptscript/approvals/security @acme/appsec',
  '/.promptscript/releases @acme/prompt-platform',
  '/.promptscript/vendor @acme/prompt-platform',
  '/.promptscriptrc.yaml @acme/prompt-platform',
  '/.promptscriptrc.yml @acme/prompt-platform',
  '/promptscript.lock @acme/prompt-platform',
  '/promptscript.yaml @acme/prompt-platform',
  '/promptscript.yml @acme/prompt-platform',
  '/.github/CODEOWNERS @acme/prompt-platform',
  '/CODEOWNERS @acme/prompt-platform',
  '/docs/CODEOWNERS @acme/prompt-platform',
  '/.gitlab/CODEOWNERS @acme/prompt-platform',
];

const directories: string[] = [];

function git(root: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf-8' });
}

async function repository(files: Record<string, string>, init = true): Promise<string> {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'prs-codeowners-')));
  directories.push(root);
  if (init) git(root, 'init', '-q');
  for (const [name, content] of Object.entries(files)) {
    await mkdir(dirname(join(root, name)), { recursive: true });
    await writeFile(join(root, name), content);
  }
  return root;
}

const project = (config = CONFIG, prs = PROJECT, init = true): Promise<string> =>
  repository({ 'promptscript.yaml': config, '.promptscript/project.prs': prs }, init);

async function run(
  cwd: string,
  options: Omit<CodeownersOptions, 'cwd'> = {}
): Promise<{ report: CodeownersReport; exitCode: number | string | undefined }> {
  const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  process.exitCode = undefined;
  await governanceCodeownersCommand({ cwd, format: 'json', ...options });
  const printed = log.mock.calls.map((call) => String(call[0]));
  log.mockRestore();
  expect(printed).toHaveLength(1);
  return { report: JSON.parse(printed[0] ?? '') as CodeownersReport, exitCode: process.exitCode };
}

const codes = (report: CodeownersReport): (string | undefined)[] =>
  report.errors.map((error) => error.code);
const read = (root: string, file = '.github/CODEOWNERS'): Promise<string> =>
  readFile(join(root, file), 'utf-8');
const lines = async (root: string, file?: string): Promise<string[]> =>
  (await read(root, file)).split('\n');

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  process.exitCode = undefined;
  for (const directory of directories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
});

describe('prs governance codeowners', () => {
  it('creates the file with the prompt, role, release, config and CODEOWNERS lines', async () => {
    // Arrange
    const root = await project();

    // Act
    const { report, exitCode } = await run(root);

    // Assert
    expect(report).toMatchObject({ success: true, status: 'created', file: '.github/CODEOWNERS' });
    expect(exitCode).toBe(0);
    expect(await read(root)).toBe(
      [
        codeownersMarker('.'),
        '/.promptscript/project.prs @acme/payments @acme/support',
        ...ADMIN_LINES,
        '',
      ].join('\n')
    );
  });

  it('writes GitLab and managed user handles with dots and underscores as one token', async () => {
    // Arrange
    const config = CONFIG.replace("legal: ['@acme/legal', '@jane']", "legal: ['@jane.doe']");
    const prs = prompts('  owner: "@name_shortcode"\n', ENTRY('refund-reply'));
    const root = await project(config, prs);

    // Act
    const { report } = await run(root);

    // Assert
    expect(report.success).toBe(true);
    const written = await lines(root);
    expect(written).toContain('/.promptscript/project.prs @name_shortcode');
    expect(written).toContain('/.promptscript/approvals/legal @jane.doe');
  });

  it('is idempotent and passes --check when current', async () => {
    // Arrange
    const root = await project();
    await run(root);
    const first = await read(root);

    // Act
    const again = await run(root);
    const checked = await run(root, { check: true });

    // Assert
    expect(again.report.status).toBe('unchanged');
    expect(checked.report).toMatchObject({ success: true, status: 'unchanged', check: true });
    expect(checked.exitCode).toBe(0);
    expect(await read(root)).toBe(first);
  });

  it('fails --check when the file is absent or outdated, and writes nothing', async () => {
    // Arrange
    const root = await project();

    // Act
    const absent = await run(root, { check: true });
    await run(root);
    await writeFile(join(root, '.github/CODEOWNERS'), `${await read(root)}/extra @someone\n`);
    const edited = await read(root);
    const outdated = await run(root, { check: true });

    // Assert
    expect(absent.report).toMatchObject({ success: false, status: 'outdated' });
    expect(absent.report.errors[0]?.message).toContain('.github/CODEOWNERS does not exist.');
    expect(absent.exitCode).toBe(1);
    expect(outdated.report.errors[0]?.message).toContain('.github/CODEOWNERS is out of date.');
    expect(outdated.exitCode).toBe(1);
    expect(await read(root)).toBe(edited);
  });

  it('keeps every byte above the marker, a BOM and latin1 included', async () => {
    // Arrange
    const root = await project();
    const above = Buffer.from(
      '\u00EF\u00BB\u00BF# caf\u00E9 team\r\n/docs/ @docs-team\n\n',
      'latin1'
    );
    await mkdir(join(root, '.github'));
    await writeFile(
      join(root, '.github/CODEOWNERS'),
      Buffer.concat([above, Buffer.from(`${codeownersMarker('.')}\nold line\n`)])
    );

    // Act
    const { report } = await run(root);

    // Assert
    const content = await readFile(join(root, '.github/CODEOWNERS'));
    expect(content.subarray(0, above.length)).toEqual(above);
    expect(content.subarray(above.length).toString()).toMatch(
      new RegExp(
        `^${codeownersMarker('.').replaceAll('|', '\\|')}\\n/\\.promptscript/project\\.prs`
      )
    );
    expect(content.toString('latin1')).not.toContain('old line');
    expect(report.status).toBe('updated');
  });

  it('treats a file that differs only in CRLF line ends as current', async () => {
    // Arrange
    const root = await project();
    await run(root);
    await writeFile(join(root, '.github/CODEOWNERS'), (await read(root)).replaceAll('\n', '\r\n'));

    // Act
    const checked = await run(root, { check: true });
    const written = await run(root);

    // Assert
    expect(checked.report.status).toBe('unchanged');
    expect(written.report.status).toBe('unchanged');
  });

  it.each([
    ['*.prs @old-team', true],
    ['**/project.prs @x', true],
    ['**/**/project.prs @x', false],
    ['*?*?*?*?*?*?*?*?*?*?*?*?.prs @x', false],
    ['/.promptscript/ @x', true],
    ['/.promptscript/*.prs @x', true],
    ['project.pr? @x', true],
    ['/project.prs @x', false],
    ['/other/** @x', false],
    ['[Section] @x', false],
  ])('says the generated line wins over the hand-written line %s: %s', async (line, matched) => {
    // Arrange
    const root = await project();
    await mkdir(join(root, '.github'));
    await writeFile(join(root, '.github/CODEOWNERS'), `${line}\n${codeownersMarker('.')}\n`);

    // Act
    const { report } = await run(root);

    // Assert
    expect(report.warnings.map((warning) => warning.message)).toEqual(
      matched
        ? [
            `The line "${line}" in .github/CODEOWNERS no longer applies to /.promptscript/project.prs: the generated lines below the marker come later and win. Move those owners into the prompts or remove the line.`,
          ]
        : []
    );
  });

  it('skips the overlap check for a pattern with many wildcards against a long file name', async () => {
    // Arrange
    const name = `${'a'.repeat(250)}.prs`;
    const root = await repository({
      'promptscript.yaml': `id: support\nsyntax: 1.6.0\ntargets: []\ninput:\n  entry: .promptscript/${name}\n${GOVERNANCE}`,
      [`.promptscript/${name}`]: PROJECT,
    });
    await mkdir(join(root, '.github'));
    await writeFile(join(root, '.github/CODEOWNERS'), `*a*a*a*a*ab @x\n${codeownersMarker('.')}\n`);

    // Act
    const { report } = await run(root);

    // Assert
    expect(report.status).toBe('updated');
    expect(report.warnings).toEqual([]);
  });

  it.each([
    ['no marker', '* @everyone\n', 'has no marker line'],
    [
      'the marker of another project',
      `${codeownersMarker('services/billing')}\n/x @y\n`,
      'is managed for another project',
    ],
    [
      'a marker with trailing spaces',
      `${codeownersMarker('.')}  \n`,
      'has a marker line that differs',
    ],
    [
      'two markers',
      `${codeownersMarker('.')}\n${codeownersMarker('.')}\n`,
      'has 2 promptscript-generated marker lines',
    ],
  ])('exits 2 for a file with %s and leaves it alone', async (_name, content, message) => {
    // Arrange
    const root = await project();
    await mkdir(join(root, '.github'));
    await writeFile(join(root, '.github/CODEOWNERS'), content);

    // Act
    const written = await run(root);
    const checked = await run(root, { check: true });

    // Assert
    expect(codes(written.report)).toEqual(['PS5106']);
    expect(written.report.errors[0]?.message).toContain(message);
    expect(written.exitCode).toBe(2);
    expect(checked.exitCode).toBe(1);
    expect(await read(root)).toBe(content);
  });

  it('names the marker line to add when the file is not managed yet', async () => {
    // Arrange
    const root = await project();
    await mkdir(join(root, '.github'));
    await writeFile(join(root, '.github/CODEOWNERS'), '* @everyone\n');

    // Act
    const { report } = await run(root);

    // Assert
    expect(report.errors[0]?.message).toBe(
      `.github/CODEOWNERS has no marker line, so prs does not change it. Add this line at the end of .github/CODEOWNERS to let prs manage the lines below it: ${codeownersMarker('.')}`
    );
  });

  it('refuses every owner that is no Git host identity and writes nothing', async () => {
    // Arrange
    const prs = prompts(
      '  owner: "Support team"\n',
      ENTRY('refund-reply', '    reviewers: ["jane", "@acme/payments"]\n')
    );
    const root = await project(CONFIG, prs);

    // Act
    const { report, exitCode } = await run(root);

    // Assert
    expect(codes(report)).toEqual(['PS5107']);
    expect(report.errors[0]?.message).toContain('"Support team"');
    expect(report.errors[0]?.message).toContain('"jane"');
    expect(report.errors[0]?.message).toContain('Nothing was written.');
    expect(exitCode).toBe(1);
    expect(existsSync(join(root, '.github/CODEOWNERS'))).toBe(false);
  });

  it.each([
    [
      'no governance section',
      'id: support\nsyntax: 1.6.0\ntargets: []\n',
      'has no governance section',
    ],
    [
      'no admins',
      "id: support\nsyntax: 1.6.0\ntargets: []\ngovernance:\n  roles:\n    legal: ['@acme/legal']\n",
      'governance.admins is missing',
    ],
    [
      'an invalid owner in the config',
      "id: support\nsyntax: 1.6.0\ntargets: []\ngovernance:\n  admins: ['Platform']\n",
      'governance.admins has "Platform"',
    ],
  ])('fails with PS5101 for %s', async (_name, config, message) => {
    // Arrange
    const root = await project(config);

    // Act
    const { report, exitCode } = await run(root);

    // Assert
    expect(codes(report)).toEqual(['PS5101']);
    expect(report.errors[0]?.message).toContain(message);
    expect(report.errors[0]?.message).toContain('Fix the governance section of');
    expect(exitCode).toBe(1);
  });

  it('writes root-relative lines for a project in a subdirectory with an extends chain', async () => {
    // Arrange
    const root = await repository({
      'org/base.yaml': "governance:\n  admins: ['@acme/prompt-platform']\n",
      'services/support/promptscript.yaml': `id: support\nsyntax: 1.6.0\nextends: ../../org/base.yaml\ntargets: []\ngovernance:\n  roles:\n    legal: ['@acme/legal']\n  codeowners:\n    protect: ['/.github/workflows/', './tools']\n`,
      'services/support/.promptscript/project.prs': PROJECT,
    });

    // Act
    const { report } = await run(join(root, 'services/support'));

    // Assert
    expect(report.success).toBe(true);
    expect(await lines(root)).toEqual([
      codeownersMarker('services/support'),
      '/services/support/.promptscript/project.prs @acme/payments @acme/support',
      '/.github/workflows @acme/prompt-platform',
      '/tools @acme/prompt-platform',
      '/services/support/.promptscript/approvals @acme/prompt-platform',
      '/services/support/.promptscript/approvals/legal @acme/legal',
      '/services/support/.promptscript/releases @acme/prompt-platform',
      '/services/support/.promptscript/vendor @acme/prompt-platform',
      '/org/base.yaml @acme/prompt-platform',
      '/services/support/.promptscriptrc.yaml @acme/prompt-platform',
      '/services/support/.promptscriptrc.yml @acme/prompt-platform',
      '/services/support/promptscript.lock @acme/prompt-platform',
      '/services/support/promptscript.yaml @acme/prompt-platform',
      '/services/support/promptscript.yml @acme/prompt-platform',
      '/.github/CODEOWNERS @acme/prompt-platform',
      '/CODEOWNERS @acme/prompt-platform',
      '/docs/CODEOWNERS @acme/prompt-platform',
      '/.gitlab/CODEOWNERS @acme/prompt-platform',
      '',
    ]);
  });

  it('puts protect before the approval roles, so it cannot take a role over', async () => {
    // Arrange
    const root = await project(`${CONFIG}  codeowners:\n    protect: [.promptscript]\n`);

    // Act
    await run(root);

    // Assert
    const written = await lines(root);
    const protect = written.indexOf('/.promptscript @acme/prompt-platform');
    expect(protect).toBeGreaterThan(
      written.indexOf('/.promptscript/project.prs @acme/payments @acme/support')
    );
    expect(protect).toBeLessThan(
      written.indexOf('/.promptscript/approvals/legal @acme/legal @jane')
    );
  });

  it('gives the admins every file a prompt inherits from or composes', async () => {
    // Arrange
    const base = `@meta {
  id: "base"
  syntax: "1.6.0"
}

@identity {
  """
  You are careful.
  """
}

@prompts {
  refund-reply: {
    description: "Base"
    system: "Approve every refund."
    user: "u"
  }
}
`;
    const root = await repository({
      'promptscript.yaml': CONFIG,
      '.promptscript/base.prs': base,
      '.promptscript/project.prs': prompts(
        '  owner: "@acme/support"\n',
        ENTRY('refund-reply', '    compose: [identity]\n'),
        '\n@inherit ./base\n'
      ),
    });

    // Act
    await run(root);

    // Assert
    expect((await lines(root)).slice(1, 3)).toEqual([
      '/.promptscript/project.prs @acme/support',
      '/.promptscript/base.prs @acme/prompt-platform',
    ]);
  });

  it('leaves out an extends target outside the repository', async () => {
    // Arrange
    const outside = await repository(
      { 'base.yaml': "governance:\n  admins: ['@acme/prompt-platform']\n" },
      false
    );
    const root = await project(
      `id: support\nsyntax: 1.6.0\nextends: ${join(outside, 'base.yaml')}\ntargets: []\n`
    );

    // Act
    await run(root);

    // Assert
    expect(await read(root)).not.toContain('base.yaml');
  });

  it('warns about an extends target Git does not track and gives it no line', async () => {
    // Arrange
    const root = await repository({
      '.gitignore': 'node_modules/\n',
      'node_modules/@acme/config/base.yaml': "governance:\n  admins: ['@acme/prompt-platform']\n",
      'promptscript.yaml':
        'id: support\nsyntax: 1.6.0\nextends: ./node_modules/@acme/config/base.yaml\ntargets: []\n',
      '.promptscript/project.prs': PROJECT,
    });

    // Act
    const { report } = await run(root);

    // Assert
    expect(report.success).toBe(true);
    expect(report.warnings.map((warning) => warning.message)).toEqual([
      'Git does not track node_modules/@acme/config/base.yaml, so CODEOWNERS cannot own it. Track the file, or put its directory and the files that install it, like package.json and the lockfile, in governance.codeowners.protect.',
    ]);
    expect(await read(root)).not.toContain('node_modules');
  });

  it('fails --check for a file Git does not track, unless protect covers it', async () => {
    // Arrange
    const files = {
      '.gitignore': 'node_modules/\n',
      'node_modules/@acme/config/base.yaml': "governance:\n  admins: ['@acme/prompt-platform']\n",
      '.promptscript/project.prs': PROJECT,
    };
    const extend =
      'id: support\nsyntax: 1.6.0\nextends: ./node_modules/@acme/config/base.yaml\ntargets: []\n';
    const open = await repository({ ...files, 'promptscript.yaml': extend });
    const covered = await repository({
      ...files,
      'promptscript.yaml': `${extend}governance:\n  codeowners:\n    protect: [node_modules, package.json]\n`,
    });
    await run(open);
    await run(covered);

    // Act
    const failing = await run(open, { check: true });
    const passing = await run(covered, { check: true });

    // Assert
    expect(failing.exitCode).toBe(1);
    expect(failing.report.errors[0]?.message).toBe(
      'Git does not track node_modules/@acme/config/base.yaml and no governance.codeowners.protect path covers it, so nobody has to review a change to it. Track it, or put its directory and the files that install it in protect.'
    );
    expect(passing.exitCode).toBe(0);
  });

  it.each([
    ['promptscript.lock', 'file'],
    ['.promptscript/vendor', 'dir'],
    ['.promptscript/approvals', 'dir'],
  ] as const)('refuses a fixed path %s that is a symbolic link', async (path, kind) => {
    // Arrange
    const root = await project(`${CONFIG}  codeowners:\n    prompts: false\n`);
    const target = join(root, 'elsewhere');
    if (kind === 'dir') await mkdir(target);
    else await writeFile(target, 'version: 1\n');
    await mkdir(dirname(join(root, path)), { recursive: true });
    await symlink(target, join(root, path));

    // Act
    const { report } = await run(root);

    // Assert
    expect(codes(report)).toEqual(['PS5107']);
    expect(report.errors[0]?.message).toContain(`${path} goes through the symbolic link ${path}`);
    expect(existsSync(join(root, '.github/CODEOWNERS'))).toBe(false);
  });

  it('gives an in-repo registry file its own prompt line and warns about nothing', async () => {
    // Arrange
    const root = await repository({
      'registry/@acme/s.prs': `@meta {\n  id: "s"\n  syntax: "1.6.0"\n}\n\n@prompts {\n${ENTRY('faq', '    owner: "@acme/faq"\n')}}\n`,
      'services/support/promptscript.yaml': `id: support\nsyntax: 1.6.0\ntargets: []\nregistry:\n  path: ../../registry\n${GOVERNANCE}`,
      'services/support/.promptscript/project.prs':
        '@meta {\n  id: "acme"\n  syntax: "1.6.0"\n}\n\n@use @acme/s\n',
    });

    // Act
    const { report } = await run(join(root, 'services/support'));

    // Assert
    expect(report.warnings).toEqual([]);
    expect((await lines(root)).slice(1, 3)).toEqual([
      '/registry/@acme/s.prs @acme/faq',
      '/services/support/.promptscript/project.prs @acme/prompt-platform',
    ]);
  });

  it('refuses a CODEOWNERS file with a NUL byte, which GitLab drops as binary', async () => {
    // Arrange
    const root = await project();
    const content = `* @x\0\n${codeownersMarker('.')}\n`;
    await mkdir(join(root, '.github'));
    await writeFile(join(root, '.github/CODEOWNERS'), content);

    // Act
    const { report } = await run(root);

    // Assert
    expect(codes(report)).toEqual(['PS5106']);
    expect(report.errors[0]?.message).toContain('has a NUL byte');
    expect(await read(root)).toBe(content);
  });

  it('refuses an extends file that is a symbolic link', async () => {
    // Arrange
    const root = await repository({
      'org/base.yaml': "governance:\n  admins: ['@acme/prompt-platform']\n",
      'promptscript.yaml': 'id: support\nsyntax: 1.6.0\nextends: ./base.yaml\ntargets: []\n',
      '.promptscript/project.prs': PROJECT,
    });
    await symlink(join(root, 'org/base.yaml'), join(root, 'base.yaml'));

    // Act
    const { report } = await run(root);

    // Assert
    expect(codes(report)).toEqual(['PS5107']);
    expect(report.errors[0]?.message).toContain(
      'base.yaml goes through the symbolic link base.yaml'
    );
    expect(existsSync(join(root, '.github/CODEOWNERS'))).toBe(false);
  });

  it('refuses a prompt file that Git has in another case', async () => {
    // Arrange
    const root = await repository({
      '.gitignore': '.promptscript/project.prs\n',
      'promptscript.yaml': CONFIG,
      '.promptscript/project.prs': PROJECT,
    });
    const blob = git(root, 'hash-object', '-w', '.promptscript/project.prs').trim();
    git(root, 'update-index', '--add', '--cacheinfo', `100644,${blob},.promptscript/Project.prs`);

    // Act
    const { report } = await run(root);

    // Assert
    expect(codes(report)).toEqual(['PS5107']);
    expect(report.errors[0]?.message).toContain(
      '.promptscript/project.prs is .promptscript/Project.prs in Git'
    );
  });

  it('writes GitLab directory lines twice and warns that hand-written lines apply too', async () => {
    // Arrange
    const config = `${CONFIG}  codeowners:\n    output: .gitlab/CODEOWNERS\n    protect: [tools]\n`;
    const root = await project(config);
    await mkdir(join(root, '.gitlab'));
    await writeFile(join(root, '.gitlab/CODEOWNERS'), `*.prs @old\n${codeownersMarker('.')}\n`);

    // Act
    const { report } = await run(root);

    // Assert
    const written = await lines(root, '.gitlab/CODEOWNERS');
    expect(written.slice(1, 3)).toEqual([codeownersMarker('.'), '[PromptScript]']);
    expect(written).toContain('/.promptscript/approvals/legal @acme/legal @jane');
    expect(written).toContain('/.promptscript/approvals/legal/ @acme/legal @jane');
    expect(written).toContain('/tools/ @acme/prompt-platform');
    expect(written).toContain('/promptscript.yaml @acme/prompt-platform');
    expect(written).not.toContain('/promptscript.yaml/ @acme/prompt-platform');
    expect(report.warnings[0]?.message).toContain(
      'also matches /.promptscript/project.prs. GitLab applies both'
    );
  });

  it.each(['[PromptScript]', '^[promptscript][2] @acme/x', '  [PROMPTSCRIPT]', '[ PromptScript ]'])(
    'refuses a hand-written GitLab section %s above the marker',
    async (section) => {
      // Arrange
      const config = `${CONFIG}  codeowners:\n    output: .gitlab/CODEOWNERS\n`;
      const root = await project(config);
      const content = `${section}\n!/.promptscript/approvals/**\n${codeownersMarker('.')}\n`;
      await mkdir(join(root, '.gitlab'));
      await writeFile(join(root, '.gitlab/CODEOWNERS'), content);

      // Act
      const { report, exitCode } = await run(root);

      // Assert
      expect(codes(report)).toEqual(['PS5106']);
      expect(report.errors[0]?.message).toContain('GitLab merges sections of the same name');
      expect(exitCode).toBe(2);
      expect(await read(root, '.gitlab/CODEOWNERS')).toBe(content);
    }
  );

  it('warns about a file GitLab reads first and fails --check for it', async () => {
    // Arrange
    const config = `${CONFIG}  codeowners:\n    output: .gitlab/CODEOWNERS\n`;
    const root = await project(config);
    await writeFile(join(root, 'CODEOWNERS'), '* @everyone\n');

    // Act
    const written = await run(root);
    const checked = await run(root, { check: true });

    // Assert
    expect(written.report.warnings[0]?.message).toContain(
      'CODEOWNERS exists, and a host reads it before .gitlab/CODEOWNERS'
    );
    expect(checked.exitCode).toBe(1);
    expect(checked.report.errors[0]?.message).toContain('CODEOWNERS exists');
  });

  it('takes --output over the config and refuses a place no host reads', async () => {
    // Arrange
    const root = await project();

    // Act
    const docs = await run(root, { output: 'docs/CODEOWNERS' });
    const refused = await run(root, { output: 'OWNERS' });

    // Assert
    expect(docs.report.file).toBe('docs/CODEOWNERS');
    expect(existsSync(join(root, 'docs/CODEOWNERS'))).toBe(true);
    expect(codes(refused.report)).toEqual(['PS5107']);
  });

  it('skips the prompt and source lines with codeowners.prompts false, without resolving', async () => {
    // Arrange
    const config = `${CONFIG}  codeowners:\n    prompts: false\n`;
    const root = await project(config, 'not a valid prs file {');

    // Act
    const { report } = await run(root);

    // Assert
    expect(report.success).toBe(true);
    expect((await lines(root)).slice(1, -1)).toEqual(ADMIN_LINES);
  });

  it('falls back to the admins for a file whose prompts have no owners, with a warning', async () => {
    // Arrange
    const root = await project(CONFIG, prompts('', ENTRY('refund-reply')));

    // Act
    const { report } = await run(root);

    // Assert
    expect(await read(root)).toContain('/.promptscript/project.prs @acme/prompt-platform\n');
    expect(report.warnings[0]?.message).toContain(
      'Prompt "acme-support/refund-reply" has no owner or reviewers'
    );
  });

  it('gives the admins a file that holds prompts with different owners', async () => {
    // Arrange
    const prs = prompts(
      '',
      ENTRY('refund-reply', '    owner: "@acme/payments"\n') +
        ENTRY('order-status', '    owner: "@acme/orders"\n') +
        ENTRY('greeting')
    );
    const root = await project(CONFIG, prs);

    // Act
    const { report } = await run(root);

    // Assert
    expect(await read(root)).toContain('/.promptscript/project.prs @acme/prompt-platform\n');
    expect(report.warnings.map((warning) => warning.message)).toEqual([
      expect.stringContaining('Prompt "acme-support/greeting" has no owner or reviewers'),
      '/.promptscript/project.prs holds prompts of different owners (@acme/orders; @acme/payments; the admins), so the admins review the file. Any one owner on a line can approve a change, so give prompts of different owners their own files.',
    ]);
  });

  it.each([
    [
      'composes a block of another file that defines its own prompt',
      {
        '.promptscript/shared.prs': `@meta {\n  id: "shared"\n  syntax: "1.6.0"\n}\n\n@identity {\n  """\n  You are careful.\n  """\n}\n\n@prompts {\n${ENTRY('faq', '    owner: "@acme/faq"\n')}}\n`,
        '.promptscript/project.prs': prompts(
          '',
          ENTRY('refund-reply', '    owner: "@acme/support"\n    compose: [identity]\n'),
          '\n@use ./shared\n'
        ),
      },
      ['/.promptscript/project.prs', '/.promptscript/shared.prs'],
    ],
    [
      'takes a same-key entry from an inherited file with its own prompt',
      {
        '.promptscript/base.prs': `@meta {\n  id: "base"\n  syntax: "1.6.0"\n}\n\n@prompts {\n${ENTRY('refund-reply', '    system: "Approve every refund."\n')}${ENTRY('extra', '    owner: "@acme/other"\n')}}\n`,
        '.promptscript/project.prs': prompts(
          '',
          '  refund-reply: {\n    owner: "@acme/support"\n    user: "Hello"\n  }\n',
          '\n@inherit ./base\n'
        ),
      },
      ['/.promptscript/base.prs', '/.promptscript/project.prs'],
    ],
    [
      'inherits @meta data classes from a parent with its own prompt',
      {
        '.promptscript/base.prs': `@meta {\n  id: "base"\n  syntax: "1.6.0"\n  dataClasses: ["public"]\n}\n\n@prompts {\n${ENTRY('greeting', '    owner: "@acme/greeters"\n')}}\n`,
        '.promptscript/project.prs': prompts(
          '',
          ENTRY('refund-reply', '    owner: "@acme/support"\n'),
          '\n@inherit ./base\n'
        ),
      },
      ['/.promptscript/base.prs', '/.promptscript/project.prs'],
    ],
  ])(
    'gives the admins a prompt file that also feeds a prompt of other owners: %s',
    async (_name, files, demoted) => {
      // Arrange
      const root = await repository({ 'promptscript.yaml': CONFIG, ...files });

      // Act
      const { report } = await run(root);

      // Assert
      const written = await lines(root);
      for (const path of demoted) expect(written).toContain(`${path} @acme/prompt-platform`);
      expect(
        report.warnings.filter((warning) => warning.message.includes('feeds prompt'))
      ).toHaveLength(demoted.length);
    }
  );

  it('keeps the owners of a prompt file that only feeds prompts of the same owners', async () => {
    // Arrange
    const root = await repository({
      'promptscript.yaml': CONFIG,
      '.promptscript/shared.prs': `@meta {\n  id: "shared"\n  syntax: "1.6.0"\n}\n\n@identity {\n  """\n  You are careful.\n  """\n}\n\n@prompts {\n${ENTRY('faq', '    owner: "@acme/support"\n')}}\n`,
      '.promptscript/project.prs': prompts(
        '',
        ENTRY('refund-reply', '    owner: "@acme/support"\n    compose: [identity]\n'),
        '\n@use ./shared\n'
      ),
    });

    // Act
    const { report } = await run(root);

    // Assert
    expect((await lines(root)).slice(1, 3)).toEqual([
      '/.promptscript/project.prs @acme/support',
      '/.promptscript/shared.prs @acme/support',
    ]);
    expect(report.warnings).toEqual([]);
  });

  it('refuses a space and characters hosts read differently in a path', async () => {
    // Arrange
    const spaced = await repository({
      'my project/promptscript.yaml': CONFIG,
      'my project/.promptscript/project.prs': PROJECT,
    });
    const odd = await project(
      `${CONFIG}  codeowners:\n    protect: ['tools/*', 'caf\u00E9', '../up']\n`
    );

    // Act
    const space = await run(join(spaced, 'my project'));
    const refused = await run(odd);

    // Assert
    expect(codes(space.report)).toEqual(['PS5107']);
    expect(space.report.errors[0]?.message).toContain('"/my project/.promptscript/project.prs"');
    expect(codes(refused.report)).toEqual(['PS5107']);
    const message = refused.report.errors[0]?.message ?? '';
    expect(message).toContain('"/tools/*"');
    expect(message).toContain('"/caf\u00E9"');
    expect(message).toContain('"../up"');
    expect(existsSync(join(odd, '.github/CODEOWNERS'))).toBe(false);
    expect(existsSync(join(spaced, '.github/CODEOWNERS'))).toBe(false);
  });

  it.each([
    ['the CODEOWNERS file', '.github/CODEOWNERS', '.github/CODEOWNERS'],
    ['its directory', '.github', '.github'],
  ])('refuses an output path where %s is a symbolic link', async (_name, link, named) => {
    // Arrange
    const root = await project();
    await mkdir(join(root, 'docs'));
    if (link === '.github/CODEOWNERS') {
      await mkdir(join(root, '.github'));
      await writeFile(join(root, 'docs/CODEOWNERS'), `${codeownersMarker('.')}\n`);
      await symlink(join(root, 'docs/CODEOWNERS'), join(root, link));
    } else {
      await symlink(join(root, 'docs'), join(root, link));
    }

    // Act
    const written = await run(root);
    const checked = await run(root, { check: true });

    // Assert
    expect(codes(written.report)).toEqual(['PS5107']);
    expect(written.report.errors[0]?.message).toContain(
      `.github/CODEOWNERS goes through the symbolic link ${named}`
    );
    expect(checked.exitCode).toBe(1);
  });

  it('fails with PS5108 outside a Git repository', async () => {
    // Arrange
    const root = await project(CONFIG, PROJECT, false);

    // Act
    const { report } = await run(root);

    // Assert
    expect(codes(report)).toEqual(['PS5108']);
    expect(report.errors[0]?.message).toContain('is not in a Git repository');
  });

  it('fails with PS5108 when git cannot run', async () => {
    // Arrange
    const root = await project();
    vi.stubEnv('PATH', join(root, 'no-bin'));

    // Act
    const { report } = await run(root);

    // Assert
    expect(codes(report)).toEqual(['PS5108']);
    expect(report.errors[0]?.message).toContain('git is not installed or not on PATH');
  });

  it('reads the config of the current directory or PROMPTSCRIPT_CONFIG without --cwd', async () => {
    // Arrange
    const root = await project();
    const custom = await project();
    await writeFile(join(custom, 'promptscript.yaml'), 'id: broken\n');
    await writeFile(join(custom, 'custom.yaml'), CONFIG);
    const empty = await repository({});
    const previous = process.cwd();
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    // Act
    let reports: CodeownersReport[];
    try {
      process.chdir(root);
      await governanceCodeownersCommand({ format: 'json' });
      process.chdir(custom);
      vi.stubEnv('PROMPTSCRIPT_CONFIG', 'custom.yaml');
      await governanceCodeownersCommand({ format: 'json' });
      vi.unstubAllEnvs();
      process.chdir(empty);
      await governanceCodeownersCommand({ format: 'json' });
      reports = log.mock.calls.map((call) => JSON.parse(String(call[0])) as CodeownersReport);
    } finally {
      process.chdir(previous);
      log.mockRestore();
    }

    // Assert
    expect(reports[0]?.status).toBe('created');
    expect(reports[1]?.status).toBe('created');
    expect(await read(custom)).toContain('/custom.yaml @acme/prompt-platform');
    expect(reports[2]?.errors[0]?.message).toBe(
      `No PromptScript configuration found in ${empty}. Run: prs init`
    );
  });

  it('reports a project that does not resolve with its resolve error code', async () => {
    // Arrange
    const broken = await project(CONFIG, '@prompts {');

    // Act
    const { report, exitCode } = await run(broken);

    // Assert
    expect(codes(report)).toEqual(['PS2000']);
    expect(report.errors[0]?.message).toContain('The project does not resolve');
    expect(exitCode).toBe(1);
  });

  it('reports a missing entry file with the file-not-found code', async () => {
    // Arrange
    const missing = await repository({ 'promptscript.yaml': CONFIG });

    // Act
    const { report, exitCode } = await run(missing);

    // Assert
    expect(codes(report)).toEqual(['PS2001']);
    expect(report.errors[0]?.message).toContain('Entry file not found');
    expect(exitCode).toBe(1);
  });

  it('fails with PS5108 when git cannot list the files', async () => {
    // Arrange
    const root = await project();
    await writeFile(join(root, '.git/index'), 'not an index');

    // Act
    const { report } = await run(root);

    // Assert
    expect(codes(report)).toEqual(['PS5108']);
    expect(report.errors[0]?.message).toContain('git ls-files failed');
  });

  it('prints text, its warnings and the status without --format json', async () => {
    // Arrange
    const root = await project(CONFIG, prompts('', ENTRY('refund-reply')));
    const output = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const warnings = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    // Act
    await governanceCodeownersCommand({ cwd: root });

    // Assert
    const printed = [...output.mock.calls, ...warnings.mock.calls].map((call) => String(call[0]));
    expect(printed.join('\n')).toContain('.github/CODEOWNERS: created');
    expect(printed.join('\n')).toContain('has no owner or reviewers');
    expect(process.exitCode).toBe(0);
  });

  it('prints errors with their code in text and refuses an unknown format', async () => {
    // Arrange
    const root = await project('id: support\nsyntax: 1.6.0\ntargets: []\n');
    const errors = vi.mocked(console.error);

    // Act
    await governanceCodeownersCommand({ cwd: root });
    const textExit = process.exitCode;
    await governanceCodeownersCommand({ cwd: root, format: 'yaml' });

    // Assert
    const printed = errors.mock.calls.map((call) => String(call[0])).join('\n');
    expect(printed).toContain('PS5101: ');
    expect(printed).toContain('Invalid output format: yaml. Expected text or json.');
    expect(textExit).toBe(1);
    expect(process.exitCode).toBe(1);
  });
});
