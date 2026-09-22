#!/usr/bin/env node
/**
 * Deno portability integration suite for the PromptScript CLI (issue #486).
 *
 * Runs the CLI under Deno in both supported modes and drives the full
 * command surface, including the managed-output cleanup regression on a
 * deno-compiled binary (which re-executes itself as the guarded worker).
 *
 * Every project that invokes the CLI installs it from the local dist bundle
 * (file: dependency), so `deno run npm:@promptscript/cli` resolves the local
 * package through node_modules instead of fetching a published one from the
 * npm registry.
 *
 * Needs: deno on PATH, npm, git. The node-free container smoke additionally
 * needs podman or docker; it is skipped when no container runtime exists.
 *
 * Usage:
 *   node --import @swc-node/register/esm-register scripts/test-deno-cli.mts
 */
import { spawn, spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createServer as createNetServer } from 'node:net';
import { platform, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI_PACKAGE_DIR = join(REPO_ROOT, 'dist', 'packages', 'cli');
const WORKSPACE = mkdtempSync(join(tmpdir(), 'prs-deno-suite-'));
const IS_WINDOWS = platform() === 'win32';
const DENO_PERMISSIONS = [
  '--allow-env',
  '--allow-sys',
  '--allow-read',
  '--allow-write',
  '--allow-net',
  '--allow-run',
];

interface RunResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

const failed: string[] = [];
const passed: string[] = [];
const skipped: string[] = [];

class TestFailure extends Error {
  public constructor(message: string) {
    super(message);
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new TestFailure(message);
  }
}

async function test(name: string, run: () => Promise<void> | void): Promise<void> {
  try {
    await run();
    passed.push(name);
    console.log(`  PASS ${name}`);
  } catch (error) {
    failed.push(name);
    console.log(`  FAIL ${name}: ${(error as Error).message}`);
  }
}

function skip(name: string, reason: string): void {
  skipped.push(name);
  console.log(`  SKIP ${name} (${reason})`);
}

function run(
  command: string,
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv; timeoutMs?: number; shell?: boolean } = {}
): Promise<RunResult> {
  return new Promise((resolveRun) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      shell: options.shell ?? false,
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    let settled = false;
    const finish = (result: RunResult): void => {
      if (!settled) {
        settled = true;
        resolveRun(result);
      }
    };
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      finish({
        code: null,
        stdout,
        stderr: `${stderr}\n[test timeout after ${options.timeoutMs ?? 120_000}ms]`,
      });
    }, options.timeoutMs ?? 120_000);
    child.on('error', (error: Error) => {
      clearTimeout(timeout);
      finish({ code: null, stdout, stderr: `${stderr}\n[spawn failed: ${error.message}]` });
    });
    child.on('close', (code) => {
      clearTimeout(timeout);
      finish({ code, stdout, stderr });
    });
  });
}

/** Isolated environment so CLI runs never touch the real user config or cache. */
function isolatedEnv(directory: string, overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  const home = join(directory, '.home');
  return {
    ...process.env,
    HOME: home,
    USERPROFILE: home,
    APPDATA: join(home, 'AppData', 'Roaming'),
    LOCALAPPDATA: join(home, 'AppData', 'Local'),
    XDG_CONFIG_HOME: join(home, '.config'),
    XDG_CACHE_HOME: join(home, '.cache'),
    DENO_DIR: join(WORKSPACE, 'deno-cache'),
    // Recognized telemetry off-values are 0/false/no/off; anything else leaves
    // it enabled and would send real payloads to the default endpoint.
    PROMPTSCRIPT_TELEMETRY: '0',
    DO_NOT_TRACK: '1',
    PROMPTSCRIPT_NO_UPDATE_CHECK: '1',
    ...overrides,
  };
}

/** Run the CLI via `deno run` inside a project that has the CLI installed. */
async function denoRun(
  projectDir: string,
  args: string[],
  options: { env?: NodeJS.ProcessEnv; timeoutMs?: number } = {}
): Promise<RunResult> {
  return run('deno', ['run', ...DENO_PERMISSIONS, 'npm:@promptscript/cli', ...args], {
    cwd: projectDir,
    env: isolatedEnv(projectDir, options.env),
    timeoutMs: options.timeoutMs,
  });
}

function npm(projectDir: string, args: string[]): Promise<RunResult> {
  // Windows ships npm only as npm.cmd, and spawning batch files without a
  // shell has thrown EINVAL since Node's CVE-2024-27980 fix. Arguments are
  // fixed literals, so a shell is safe here.
  return run('npm', args, { cwd: projectDir, timeoutMs: 300_000, shell: IS_WINDOWS });
}

function makeProject(name: string, dependency: string): string {
  const projectDir = join(WORKSPACE, name);
  mkdirSync(projectDir, { recursive: true });
  mkdirSync(join(projectDir, '.home'), { recursive: true });
  writeFileSync(
    join(projectDir, 'package.json'),
    JSON.stringify(
      { name, version: '1.0.0', type: 'module', dependencies: { '@promptscript/cli': dependency } },
      null,
      2
    )
  );
  return projectDir;
}

async function installProject(projectDir: string, label: string): Promise<void> {
  const result = await npm(projectDir, ['install', '--install-links', '--no-fund', '--no-audit']);
  assert(
    result.code === 0 && existsSync(join(projectDir, 'node_modules', '@promptscript', 'cli')),
    `${label} npm install failed: ${result.stderr}`
  );
}

/** Fresh project with the local CLI installed, for any test that invokes the CLI. */
async function makeInstalledProject(name: string): Promise<string> {
  const projectDir = makeProject(name, `file:${CLI_PACKAGE_DIR}`);
  await installProject(projectDir, name);
  return projectDir;
}

function writeProjectFile(projectDir: string, relativePath: string, content: string): void {
  const target = join(projectDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
}

function readCliPackageVersion(): string {
  const pkg = JSON.parse(readFileSync(join(CLI_PACKAGE_DIR, 'package.json'), 'utf-8')) as {
    version?: string;
  };
  assert(
    typeof pkg.version === 'string' && /^\d+\.\d+\.\d+/.test(pkg.version),
    'CLI package version missing'
  );
  return pkg.version as string;
}

/** The shared managed-output cleanup scenario, driven by a runner function. */
type CleanupRunner = (args: string[]) => Promise<RunResult>;

async function cleanupScenario(
  label: string,
  runCommand: CleanupRunner,
  options: { install?: boolean } = {}
): Promise<void> {
  const projectDir = join(WORKSPACE, label);
  if (options.install === true) {
    await installProject(makeProject(label, `file:${CLI_PACKAGE_DIR}`), label);
  } else {
    mkdirSync(join(projectDir, '.home'), { recursive: true });
  }
  writeProjectFile(
    projectDir,
    'promptscript.yaml',
    [
      'id: cleanup',
      'syntax: 1.5.0',
      'targets:',
      '  - factory:',
      '      version: full',
      '      rulesMode: split',
      '',
    ].join('\n')
  );
  writeProjectFile(
    projectDir,
    '.promptscript/project.prs',
    [
      '@meta {',
      '  id: "cleanup"',
      '  syntax: "1.5.0"',
      '}',
      '@restrictions {',
      '  - "First rule"',
      '}',
      '',
    ].join('\n')
  );

  let result = await runCommand(['compile']);
  assert(result.code === 0, `first compile failed: ${result.stderr}`);
  assert(
    existsSync(join(projectDir, '.factory/rules/restrictions.md')),
    'restrictions.md was not generated'
  );

  // User files and a symlink in the managed directory must survive cleanup.
  writeFileSync(join(projectDir, '.factory/rules/user-owned.md'), 'USER OWNED\n');
  const escapeTarget = join(projectDir, 'escape-target.txt');
  writeFileSync(escapeTarget, 'ESCAPE\n');
  if (!IS_WINDOWS) {
    symlinkSync(escapeTarget, join(projectDir, '.factory/rules/escape.md'));
  }

  // Mixed hook output: a foreign hook must survive pruning of owned hooks.
  writeProjectFile(
    projectDir,
    '.promptscript/project.prs',
    [
      '@meta {',
      '  id: "cleanup"',
      '  syntax: "1.5.0"',
      '}',
      '@hooks {',
      '  e2e-hook: {',
      '    event: "post-tool-use"',
      '    matcher: "Edit|Write"',
      '    command: ["echo", "hi"]',
      '  }',
      '}',
      '',
    ].join('\n')
  );
  result = await runCommand(['compile']);
  assert(result.code === 0, `hooks compile failed: ${result.stderr}`);
  assert(existsSync(join(projectDir, '.factory/hooks.json')), 'hooks.json was not generated');
  // restrictions.md became obsolete the moment the restrictions block left
  // the program, so this compile must remove it and report the removal.
  assert(
    result.stdout.includes('Removed obsolete generated file'),
    `cleanup did not report the stale removal; stdout: ${result.stdout}`
  );
  assert(
    !existsSync(join(projectDir, '.factory/rules/restrictions.md')),
    'stale restrictions.md was not removed'
  );
  const hooksPath = join(projectDir, '.factory/hooks.json');
  const hooks = JSON.parse(readFileSync(hooksPath, 'utf-8')) as Record<string, unknown>;
  (hooks as { hooks: Record<string, unknown[]> })['hooks']['PreToolUse'] = [
    { hooks: [{ type: 'command', command: 'echo foreign' }] },
  ];
  writeFileSync(hooksPath, JSON.stringify(hooks, null, 2));

  // Drop every managed block: the mixed hook file must be rewritten, user
  // files kept, symlinks never followed.
  writeProjectFile(
    projectDir,
    '.promptscript/project.prs',
    ['@meta {', '  id: "cleanup"', '  syntax: "1.5.0"', '}', ''].join('\n')
  );
  result = await runCommand(['compile']);
  assert(result.code === 0, `cleanup compile failed: ${result.stderr}`);
  assert(
    result.stdout.includes('Rewrote mixed managed hook file'),
    `cleanup did not rewrite the mixed hooks file; stdout: ${result.stdout}`
  );
  assert(
    readFileSync(join(projectDir, '.factory/rules/user-owned.md'), 'utf-8') === 'USER OWNED\n',
    'user file was removed'
  );
  assert(readFileSync(escapeTarget, 'utf-8') === 'ESCAPE\n', 'symlink escape target was modified');
  const rewrittenHooks = readFileSync(hooksPath, 'utf-8');
  assert(rewrittenHooks.includes('"echo foreign"'), 'foreign hook entry was dropped');
  assert(
    !rewrittenHooks.includes('promptscript-generated'),
    'owned hook entry survived the rewrite'
  );

  // With only the now-removable generated files left, the empty managed
  // directory itself must be pruned.
  rmSync(join(projectDir, '.factory/rules/user-owned.md'));
  if (!IS_WINDOWS) {
    rmSync(join(projectDir, '.factory/rules/escape.md'));
  }
  writeProjectFile(
    projectDir,
    '.promptscript/project.prs',
    [
      '@meta {',
      '  id: "cleanup"',
      '  syntax: "1.5.0"',
      '}',
      '@restrictions {',
      '  - "Second rule"',
      '}',
      '',
    ].join('\n')
  );
  result = await runCommand(['compile']);
  assert(result.code === 0, `prune compile failed: ${result.stderr}`);
  assert(
    existsSync(join(projectDir, '.factory/rules/restrictions.md')),
    'second restrictions.md was not generated'
  );
  writeProjectFile(
    projectDir,
    '.promptscript/project.prs',
    ['@meta {', '  id: "cleanup"', '  syntax: "1.5.0"', '}', ''].join('\n')
  );
  result = await runCommand(['compile']);
  assert(result.code === 0, `final prune compile failed: ${result.stderr}`);
  assert(!existsSync(join(projectDir, '.factory/rules')), 'empty managed directory was not pruned');
}

async function main(): Promise<void> {
  console.log(`Deno CLI suite\n  cli package: ${CLI_PACKAGE_DIR}\n  workspace:  ${WORKSPACE}`);
  const version = readCliPackageVersion();
  assert(
    existsSync(join(CLI_PACKAGE_DIR, 'managed-output-worker.js')),
    'worker bundle missing from package'
  );

  // ---------------------------------------------------------------- projects
  const distProject = await makeInstalledProject('dist-project');

  const tarballDir = join(WORKSPACE, 'tarball');
  mkdirSync(tarballDir, { recursive: true });
  const packResult = await run('npm', ['pack', '--pack-destination', tarballDir, CLI_PACKAGE_DIR], {
    cwd: tarballDir,
    timeoutMs: 120_000,
  });
  assert(packResult.code === 0, `npm pack failed: ${packResult.stderr}`);
  const tarballName = packResult.stdout.trim().split('\n').at(-1) ?? '';
  const tarballProject = makeProject('tarball-project', `file:${join(tarballDir, tarballName)}`);
  await installProject(tarballProject, 'tarball');
  assert(
    existsSync(
      join(tarballProject, 'node_modules', '@promptscript', 'cli', 'managed-output-worker.js')
    ),
    'worker bundle missing from installed tarball'
  );

  // ------------------------------------------------------------ version/help
  await test('deno run: --version prints the package version (dist)', async () => {
    const result = await denoRun(distProject, ['--version']);
    assert(
      result.code === 0 && result.stdout.trim() === version,
      `got: ${result.stdout} / ${result.stderr}`
    );
  });
  await test('deno run: --version prints the package version (tarball)', async () => {
    const result = await denoRun(tarballProject, ['--version']);
    assert(
      result.code === 0 && result.stdout.trim() === version,
      `got: ${result.stdout} / ${result.stderr}`
    );
  });
  await test('deno run: --help exits 0', async () => {
    const result = await denoRun(distProject, ['--help']);
    assert(
      result.code === 0 && result.stdout.includes('Usage: prs'),
      `got ${result.code}: ${result.stderr}`
    );
  });

  // ------------------------------------------------------------ init/validate
  await test('init -y installs the embedded skill and validates', async () => {
    const result = await denoRun(distProject, [
      'init',
      '-y',
      '--name',
      'e2e',
      '--targets',
      'claude',
    ]);
    assert(result.code === 0, `init failed: ${result.stderr}`);
    const skill = join(distProject, '.promptscript/skills/promptscript/SKILL.md');
    assert(existsSync(skill), 'embedded skill was not installed');
    const content = readFileSync(skill, 'utf-8');
    assert(content.includes('name: promptscript'), 'installed skill has wrong content');
    assert(content.trim().length > 100, 'installed skill looks truncated');
    assert(
      existsSync(join(distProject, '.promptscript/project.prs')),
      'project.prs was not created'
    );
  });

  await test('validate --strict, check, and diff all pass', async () => {
    const validate = await denoRun(distProject, ['validate', '--strict']);
    assert(validate.code === 0, `validate failed: ${validate.stderr}`);
    const check = await denoRun(distProject, ['check']);
    assert(check.code === 0, `check failed: ${check.stderr}`);
    const diff = await denoRun(distProject, ['diff', '--no-pager']);
    assert(diff.code === 0, `diff failed: ${diff.stderr}`);
  });

  // ------------------------------------------------------ targets + profiles
  await test('compile covers all targets and build profiles', async () => {
    writeProjectFile(
      distProject,
      'promptscript.yaml',
      [
        'id: e2e',
        'syntax: 1.5.0',
        'targets:',
        '  - github',
        '  - claude',
        '  - cursor',
        '  - factory',
        '  - windsurf',
        'builds:',
        '  docs-build:',
        '    entry: .promptscript/project.prs',
        '    output: build-output/docs',
        '    targets:',
        '      - github',
        '  claude-build:',
        '    entry: .promptscript/project.prs',
        '    output: build-output/claude',
        '    targets:',
        '      - claude',
        '',
      ].join('\n')
    );
    const all = await denoRun(distProject, ['compile', '--all', '--force']);
    assert(all.code === 0, `compile --all failed: ${all.stderr}`);
    assert(
      existsSync(join(distProject, '.github/copilot-instructions.md')),
      'github output missing'
    );
    assert(existsSync(join(distProject, 'CLAUDE.md')), 'claude output missing');
    assert(existsSync(join(distProject, '.cursor/rules')), 'cursor output directory missing');
    const cursorFiles = readdirSync(join(distProject, '.cursor/rules'));
    assert(
      cursorFiles.some((name) => name.endsWith('.mdc')),
      `cursor rules contained no .mdc files: ${cursorFiles.join(', ')}`
    );

    const profile = await denoRun(distProject, ['build', 'docs-build']);
    assert(profile.code === 0, `build docs-build failed: ${profile.stderr}`);
    assert(
      existsSync(join(distProject, 'build-output/docs/.github/copilot-instructions.md')),
      'profile output missing'
    );

    const allBuilds = await denoRun(distProject, ['compile', '--all-builds', '--force']);
    assert(allBuilds.code === 0, `compile --all-builds failed: ${allBuilds.stderr}`);
    assert(
      existsSync(join(distProject, 'build-output/claude/CLAUDE.md')),
      'claude profile output missing'
    );
  });

  // ------------------------------------------------- local imports and skills
  await test('local imports and local skills resolve and compile', async () => {
    writeProjectFile(
      distProject,
      '.promptscript/local.prs',
      ['@standards {', '  testing: ["Cover every behavior change"]', '}', ''].join('\n')
    );
    writeProjectFile(
      distProject,
      '.promptscript/project.prs',
      [
        '@meta {',
        '  id: "e2e"',
        '  syntax: "1.5.0"',
        '}',
        '@use ./local.prs',
        '@skills {',
        '  local-help: {',
        '    description: "Local suite skill"',
        '    content: """',
        '      Help with local verification.',
        '    """',
        '  }',
        '}',
        '',
      ].join('\n')
    );
    writeProjectFile(
      distProject,
      'promptscript.yaml',
      ['id: e2e', 'syntax: 1.5.0', 'targets:', '  - claude', ''].join('\n')
    );
    const result = await denoRun(distProject, ['compile', '--force']);
    assert(result.code === 0, `compile failed: ${result.stderr}`);
    const claude = readFileSync(join(distProject, 'CLAUDE.md'), 'utf-8');
    assert(claude.includes('Cover every behavior change'), 'local @use import did not resolve');
    assert(
      existsSync(join(distProject, '.claude/skills/local-help/SKILL.md')),
      'local skill was not compiled'
    );
  });

  // -------------------------------------------------- cleanup (deno run mode)
  await test('managed output cleanup regression under deno run', async () => {
    const projectDir = join(WORKSPACE, 'cleanup-denorun');
    await cleanupScenario('cleanup-denorun', (args) => denoRun(projectDir, args), {
      install: true,
    });
  });

  // --------------------------------------------------------------------- watch
  await test('compile --watch recompiles after a source edit', async () => {
    const projectDir = await makeInstalledProject('watch-project');
    writeProjectFile(
      projectDir,
      'promptscript.yaml',
      ['id: watch', 'syntax: 1.5.0', 'targets:', '  - github', ''].join('\n')
    );
    writeProjectFile(
      projectDir,
      '.promptscript/project.prs',
      [
        '@meta {',
        '  id: "watch"',
        '  syntax: "1.5.0"',
        '}',
        '@restrictions {',
        '  - "Watch one"',
        '}',
        '',
      ].join('\n')
    );
    // The watcher needs the real PATH so deno, git, and the CLI resolve;
    // everything user-owned is isolated through HOME and DENO_DIR.
    const child = spawn(
      'deno', // NOSONAR
      ['run', ...DENO_PERMISSIONS, 'npm:@promptscript/cli', 'compile', '--watch'],
      {
        cwd: projectDir,
        env: isolatedEnv(projectDir),
        windowsHide: true,
        // The watch spinner writes continuously; an unconsumed stdout pipe
        // would fill its buffer and freeze the watcher.
        stdio: 'ignore',
      }
    );
    try {
      const output = await waitForContent(
        join(projectDir, '.github/copilot-instructions.md'),
        'Watch one',
        60_000
      );
      assert(output, 'initial watch compile did not produce output');
      // Give the watcher time to finish its initial scan before the first
      // edit; an edit that lands inside the scan is suppressed by
      // ignoreInitial and would never trigger a recompile.
      await delay(2_000);
      writeProjectFile(
        projectDir,
        '.promptscript/project.prs',
        [
          '@meta {',
          '  id: "watch"',
          '  syntax: "1.5.0"',
          '}',
          '@restrictions {',
          '  - "Watch two"',
          '}',
          '',
        ].join('\n')
      );
      let recompiled = await waitForContent(
        join(projectDir, '.github/copilot-instructions.md'),
        'Watch two',
        60_000
      );
      if (!recompiled) {
        // The settle window can still be too short on slow machines; nudge
        // once more, when the watcher is guaranteed to be ready.
        writeProjectFile(
          projectDir,
          '.promptscript/project.prs',
          [
            '@meta {',
            '  id: "watch"',
            '  syntax: "1.5.0"',
            '}',
            '@restrictions {',
            '  - "Watch retry"',
            '}',
            '',
          ].join('\n')
        );
        recompiled = await waitForContent(
          join(projectDir, '.github/copilot-instructions.md'),
          'Watch retry',
          60_000
        );
      }
      assert(recompiled, 'watch did not recompile after the edit');
    } finally {
      child.kill('SIGKILL');
    }
  });

  // ------------------------------------------------------------- git registry
  await test('git registry pull, lock, and compile work', async () => {
    const registryDir = join(WORKSPACE, 'git-registry');
    mkdirSync(join(registryDir, '@core'), { recursive: true });
    writeFileSync(
      join(registryDir, 'registry-manifest.yaml'),
      [
        "version: '1'",
        '',
        'meta:',
        "  name: 'suite-registry'",
        "  description: 'Deno suite registry'",
        "  lastUpdated: '2026-09-21'",
        '',
        'namespaces:',
        "  '@core':",
        "    description: 'Core configurations'",
        '    priority: 100',
        '',
        'catalog:',
        "  - id: '@core/team-standards'",
        "    path: '@core/team-standards.prs'",
        "    name: 'Team Standards'",
        "    description: 'Team standards mixin'",
        '    tags: [core]',
        '    targets: [claude]',
        '    dependencies: []',
        '',
      ].join('\n')
    );
    writeFileSync(
      join(registryDir, '@core', 'team-standards.prs'),
      ['@standards {', '  testing: ["Cover pulled registry standards"]', '}', ''].join('\n')
    );
    const gitInit = await run('git', ['init', '--initial-branch=main'], { cwd: registryDir });
    assert(gitInit.code === 0, `git init failed: ${gitInit.stderr}`);
    const gitAdd = await run('git', ['add', '.'], { cwd: registryDir });
    assert(gitAdd.code === 0, `git add failed: ${gitAdd.stderr}`);
    const gitCommit = await run(
      'git',
      ['-c', 'user.name=suite', '-c', 'user.email=suite@example.com', 'commit', '-m', 'init'],
      { cwd: registryDir }
    );
    assert(gitCommit.code === 0, `git commit failed: ${gitCommit.stderr}`);

    const projectDir = await makeInstalledProject('registry-project');
    writeProjectFile(
      projectDir,
      'promptscript.yaml',
      [
        'id: registry-e2e',
        'syntax: 1.5.0',
        'registry:',
        '  git:',
        `    url: ${pathToFileURL(registryDir).href}`,
        '    ref: main',
        'targets:',
        '  - claude',
        '',
      ].join('\n')
    );
    writeProjectFile(
      projectDir,
      '.promptscript/project.prs',
      [
        '@meta {',
        '  id: "registry-e2e"',
        '  syntax: "1.5.0"',
        '}',
        '@use @core/team-standards',
        '',
      ].join('\n')
    );

    const dryPull = await denoRun(projectDir, ['pull', '--dry-run']);
    assert(dryPull.code === 0, `pull --dry-run failed: ${dryPull.stderr}`);
    const pullReal = await denoRun(projectDir, ['pull']);
    assert(pullReal.code === 0, `pull failed: ${pullReal.stderr}`);

    const lock = await denoRun(projectDir, ['lock']);
    assert(lock.code === 0, `lock failed: ${lock.stderr}`);
    assert(existsSync(join(projectDir, 'promptscript.lock')), 'promptscript.lock was not written');

    // Vendoring is not exercised against the local registry: vendor paths are
    // derived from git URLs as host/owner/repo, which file:// URLs cannot
    // express. The git child-process surface is already covered by pull.

    const compiled = await denoRun(projectDir, ['compile', '--force']);
    assert(compiled.code === 0, `compile with registry content failed: ${compiled.stderr}`);
    const claude = readFileSync(join(projectDir, 'CLAUDE.md'), 'utf-8');
    assert(
      claude.includes('Cover pulled registry standards'),
      'registry content missing from compiled output'
    );
  });

  // ------------------------------------------------------- registry management
  await test('registry init and validate work', async () => {
    const projectDir = await makeInstalledProject('registry-manage');
    const init = await denoRun(projectDir, ['registry', 'init', 'suite-registry', '-y']);
    assert(init.code === 0, `registry init failed: ${init.stderr}`);
    assert(
      existsSync(join(projectDir, 'suite-registry/registry-manifest.yaml')),
      'registry-manifest.yaml missing'
    );
    const validate = await denoRun(projectDir, ['registry', 'validate', 'suite-registry']);
    assert(validate.code === 0, `registry validate failed: ${validate.stderr}`);
  });

  await test('hooks install and uninstall work', async () => {
    const projectDir = await makeInstalledProject('hooks-project');
    writeProjectFile(
      projectDir,
      'promptscript.yaml',
      ['id: hooks-e2e', 'syntax: 1.5.0', 'targets:', '  - claude', ''].join('\n')
    );
    writeProjectFile(
      projectDir,
      '.promptscript/project.prs',
      ['@meta {', '  id: "hooks-e2e"', '  syntax: "1.5.0"', '}', ''].join('\n')
    );
    const install = await denoRun(projectDir, ['hooks', 'install', 'claude']);
    assert(install.code === 0, `hooks install failed: ${install.stderr}`);
    const settings = readFileSync(join(projectDir, '.claude/settings.json'), 'utf-8');
    assert(settings.includes('hook pre-edit'), 'installed hooks missing the pre-edit entry');
    assert(settings.includes('PromptScript:'), 'installed hooks missing the PromptScript marker');
    const uninstall = await denoRun(projectDir, ['hooks', 'uninstall', 'claude']);
    assert(uninstall.code === 0, `hooks uninstall failed: ${uninstall.stderr}`);
    const after = readFileSync(join(projectDir, '.claude/settings.json'), 'utf-8');
    assert(!after.includes('hook pre-edit'), 'owned hooks survived uninstall');
  });

  // ---------------------------------------------------------------- telemetry
  await test('telemetry spools runtime: deno and flushes via self-invocation', async () => {
    const projectDir = await makeInstalledProject('telemetry-project');
    writeProjectFile(
      projectDir,
      'promptscript.yaml',
      ['id: telemetry-e2e', 'syntax: 1.5.0', 'targets:', '  - github', ''].join('\n')
    );
    writeProjectFile(
      projectDir,
      '.promptscript/project.prs',
      ['@meta {', '  id: "telemetry-e2e"', '  syntax: "1.5.0"', '}', ''].join('\n')
    );
    const cacheDir = join(projectDir, '.home', '.promptscript', '.cache');
    // The endpoint must be https to pass the telemetry config's secure-endpoint
    // gate; .invalid never resolves, so the flush child stays fully offline.
    // DO_NOT_TRACK must be cleared here or the run is treated as opt-out.
    const telemetryEnv: NodeJS.ProcessEnv = {
      PROMPTSCRIPT_TELEMETRY: '1',
      PROMPTSCRIPT_TELEMETRY_ENDPOINT: 'https://telemetry.invalid/v1/events',
      DO_NOT_TRACK: '',
    };

    const first = await denoRun(projectDir, ['check'], { env: telemetryEnv });
    assert(first.code === 0, `check under telemetry failed: ${first.stderr}`);
    const spoolPath = join(cacheDir, 'telemetry.ndjson');
    assert(existsSync(spoolPath), 'telemetry spool was not written');
    const records = readFileSync(spoolPath, 'utf-8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as { runtime?: string; event?: { command?: string } });
    assert(records.length > 0, 'telemetry spool is empty');
    assert(
      records.every((record) => record.runtime === 'deno'),
      `spool had non-deno records: ${JSON.stringify(records)}`
    );
    assert(
      records.some((record) => record.event?.['command'] === 'check'),
      'spool missed the check command event'
    );

    // A later startup with a non-empty spool must spawn the background flush
    // child through the deno self-invocation; the child records its attempt
    // in telemetry-state.json.
    const second = await denoRun(projectDir, ['check'], { env: telemetryEnv });
    assert(second.code === 0, `second check failed: ${second.stderr}`);
    const flushed = await waitForFile(join(cacheDir, 'telemetry-state.json'), 90_000);
    assert(flushed, 'background flush child never ran (no telemetry-state.json)');

    const disable = await denoRun(projectDir, ['telemetry', 'disable']);
    assert(disable.code === 0, `telemetry disable failed: ${disable.stderr}`);
  });

  // --------------------------------------------------------------------- serve
  await test('serve answers an HTTP request', async () => {
    const projectDir = await makeInstalledProject('serve-project');
    writeProjectFile(
      projectDir,
      'promptscript.yaml',
      ['id: serve-e2e', 'syntax: 1.5.0', 'targets:', '  - github', ''].join('\n')
    );
    writeProjectFile(
      projectDir,
      '.promptscript/project.prs',
      ['@meta {', '  id: "serve-e2e"', '  syntax: "1.5.0"', '}', ''].join('\n')
    );
    // Port 0 is rejected by the CLI, so reserve a concrete free port instead.
    const port = await findFreePort();
    // Same PATH story as the watch test: the server child needs real tool
    // lookup while HOME stays isolated.
    const child = spawn(
      'deno', // NOSONAR
      [
        'run',
        ...DENO_PERMISSIONS,
        'npm:@promptscript/cli',
        'serve',
        '--port',
        String(port),
        '--host',
        '127.0.0.1',
      ],
      {
        cwd: projectDir,
        env: isolatedEnv(projectDir),
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
    let childOutput = '';
    child.stdout?.on('data', (chunk: Buffer) => {
      childOutput += chunk.toString();
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      childOutput += chunk.toString();
    });
    try {
      const healthy = await waitForHealth(`http://127.0.0.1:${port}/api/health`, 30_000);
      assert(healthy, `serve never answered /api/health: ${childOutput}`);
    } finally {
      child.kill('SIGKILL');
    }
  });

  // ------------------------------------------------------------ pager + clipboard
  if (!IS_WINDOWS) {
    await test('pager and clipboard run through fake executables on PATH', async () => {
      const projectDir = await makeInstalledProject('pager-project');
      mkdirSync(join(projectDir, 'fakebin'), { recursive: true });
      const pagerLog = join(projectDir, 'pager.log');
      writeFileSync(
        join(projectDir, 'fakebin', 'prs-fake-pager'),
        [
          '#!/bin/sh',
          'echo "PAGER-INVOKED" >> "$PRS_PAGER_LOG"',
          'cat > /dev/null',
          'exit 0',
          '',
        ].join('\n')
      );
      chmodSync(join(projectDir, 'fakebin', 'prs-fake-pager'), 0o755);

      writeProjectFile(
        projectDir,
        'promptscript.yaml',
        ['id: pager-e2e', 'syntax: 1.5.0', 'targets:', '  - github', ''].join('\n')
      );
      writeProjectFile(
        projectDir,
        '.promptscript/project.prs',
        ['@meta {', '  id: "pager-e2e"', '  syntax: "1.5.0"', '}', ''].join('\n')
      );
      const compileResult = await denoRun(projectDir, ['compile', '--force']);
      assert(compileResult.code === 0, `compile failed: ${compileResult.stderr}`);

      // The pager only engages on a TTY. script(1) itself needs a TTY on
      // stdin, so allocate a pty through python3 instead.
      // Probing python3 inherits PATH on purpose; the harness only checks availability.
      const python3 = spawnSync('python3', ['--version'], { windowsHide: true }).status === 0; // NOSONAR
      if (python3) {
        const paged = await run(
          'python3',
          [
            '-c',
            'import pty, sys; pty.spawn(sys.argv[1:])',
            'deno',
            'run',
            ...DENO_PERMISSIONS,
            'npm:@promptscript/cli',
            'diff',
          ],
          {
            cwd: projectDir,
            env: isolatedEnv(projectDir, {
              PAGER: 'prs-fake-pager',
              PRS_PAGER_LOG: pagerLog,
              PATH: prependPath(projectDir),
            }),
            timeoutMs: 180_000,
          }
        );
        assert(paged.code === 0, `diff under a pty failed: ${paged.stdout}${paged.stderr}`);
        assert(
          readFileSync(pagerLog, 'utf-8').includes('PAGER-INVOKED'),
          'fake pager was never invoked under a TTY'
        );
      } else {
        skip('pager tty check', 'python3 not available to allocate a pty');
      }

      // The clipboard copy only happens when migration initializes a fresh
      // project (with --llm the prompt goes to stdout instead), so drive it
      // from an uninitialized project.
      const migrateProject = await makeInstalledProject('migrate-project');
      mkdirSync(join(migrateProject, 'fakebin'), { recursive: true });
      const migrateClipLog = join(migrateProject, 'clip.log');
      for (const clipboardName of ['pbcopy', 'xclip', 'xsel']) {
        writeFileSync(
          join(migrateProject, 'fakebin', clipboardName),
          ['#!/bin/sh', 'cat > "$PRS_CLIP_LOG"', 'exit 0', ''].join('\n')
        );
        chmodSync(join(migrateProject, 'fakebin', clipboardName), 0o755);
      }
      writeProjectFile(
        migrateProject,
        'CLAUDE.md',
        ['# Migration candidate', '', 'Some instructions to import.', ''].join('\n')
      );
      const migrate = await denoRun(
        migrateProject,
        ['migrate', '--llm', '--files', 'CLAUDE.md', '--force', '--targets', 'claude'],
        { env: { PATH: prependPath(migrateProject), PRS_CLIP_LOG: migrateClipLog } }
      );
      assert(migrate.code === 0, `migrate --llm failed: ${migrate.stderr}`);
      assert(existsSync(migrateClipLog), 'fake clipboard executable was never invoked');
    });
  } else {
    skip('pager and clipboard fakes', 'POSIX-only fake executables');
  }

  // --------------------------------------------------------- compiled binary
  // Deno appends .exe to the output name when compiling on Windows.
  const binaryPath = join(WORKSPACE, IS_WINDOWS ? 'prs-bin.exe' : 'prs-bin');
  await test('deno compile produces a working standalone binary', async () => {
    const entry = join(distProject, 'node_modules', '@promptscript', 'cli', 'bin', 'prs.js');
    const result = await run('deno', ['compile', ...DENO_PERMISSIONS, '-o', binaryPath, entry], {
      cwd: distProject,
      timeoutMs: 300_000,
    });
    assert(result.code === 0 && existsSync(binaryPath), `deno compile failed: ${result.stderr}`);
    const versionResult = await run(binaryPath, ['--version'], { timeoutMs: 60_000 });
    assert(
      versionResult.code === 0 && versionResult.stdout.trim() === version,
      `binary --version failed: ${versionResult.stdout} ${versionResult.stderr}`
    );
  });

  await test('managed output cleanup regression on the compiled binary', async () => {
    const projectDir = join(WORKSPACE, 'cleanup-binary');
    await cleanupScenario(
      'cleanup-binary',
      (args) => run(binaryPath, args, { cwd: projectDir, env: isolatedEnv(projectDir) }),
      { install: false }
    );
  });

  await test('compiled binary needs no node_modules to run', async () => {
    const bareDir = join(WORKSPACE, 'bare-run');
    mkdirSync(join(bareDir, '.home'), { recursive: true });
    writeFileSync(join(bareDir, 'promptscript.yaml'), 'id: bare\nsyntax: 1.5.0\ntargets: []\n');
    const result = await run(binaryPath, ['--help'], {
      cwd: bareDir,
      env: isolatedEnv(bareDir),
      timeoutMs: 60_000,
    });
    assert(result.code === 0, `bare run failed: ${result.stderr}`);
  });

  // ---------------------------------------------------- node-free container
  await runContainerSmoke(version);

  // ------------------------------------------------------------------- report
  console.log(
    `\nDeno CLI suite: ${passed.length} passed, ${failed.length} failed, ${skipped.length} skipped`
  );
  if (skipped.length > 0) {
    for (const name of skipped) {
      console.log(`  skipped: ${name}`);
    }
  }
  if (failed.length > 0) {
    for (const name of failed) {
      console.log(`  failed: ${name}`);
    }
    rmSync(WORKSPACE, { recursive: true, force: true });
    process.exit(1);
  }
  rmSync(WORKSPACE, { recursive: true, force: true });
}

/** Prepend a fakebin directory to PATH for a spawned CLI. */
function prependPath(projectDir: string): string {
  return `${join(projectDir, 'fakebin')}${IS_WINDOWS ? ';' : ':'}${process.env['PATH'] ?? ''}`;
}

/** Poll until a file exists and contains the expected text. */
async function waitForContent(path: string, expected: string, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (existsSync(path)) {
      const content = readFileSync(path, 'utf-8');
      if (content.includes(expected)) {
        return true;
      }
    }
    await delay(500);
  }
  return false;
}

/** Poll until a file exists. */
async function waitForFile(path: string, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (existsSync(path)) {
      return true;
    }
    await delay(500);
  }
  return existsSync(path);
}

/** Poll an HTTP endpoint until it answers with 200. */
async function waitForHealth(url: string, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return true;
      }
    } catch {
      // Not up yet.
    }
    await delay(500);
  }
  return false;
}

/** Reserve a concrete free TCP port on 127.0.0.1 and release it again. */
function findFreePort(): Promise<number> {
  return new Promise((resolvePort, rejectPort) => {
    const server = createNetServer();
    server.on('error', rejectPort);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address !== null ? address.port : 0;
      server.close(() => resolvePort(port));
    });
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

/** Cross-compile for the container and run the cleanup scenario inside it. */
async function runContainerSmoke(version: string): Promise<void> {
  const runtime = ['podman', 'docker'].find(
    (candidate) => spawnSync(candidate, ['--version'], { windowsHide: true }).status === 0
  );
  if (runtime === undefined) {
    skip('node-free container smoke', 'no podman or docker found');
    return;
  }
  if (IS_WINDOWS) {
    skip('node-free container smoke', 'not supported on Windows runners');
    return;
  }

  await test('compiled binary runs in a node-free container', async () => {
    const hostArch = process.arch === 'arm64' ? 'aarch64' : 'x86_64';
    const containerBinary = join(WORKSPACE, `prs-bin-linux-${hostArch}`);
    const entry = join(
      WORKSPACE,
      'dist-project',
      'node_modules',
      '@promptscript',
      'cli',
      'bin',
      'prs.js'
    );
    const compileResult = await run(
      'deno',
      [
        'compile',
        ...DENO_PERMISSIONS,
        '--target',
        `${hostArch}-unknown-linux-gnu`,
        '-o',
        containerBinary,
        entry,
      ],
      { cwd: WORKSPACE, timeoutMs: 300_000 }
    );
    assert(compileResult.code === 0, `cross compile failed: ${compileResult.stderr}`);

    const projectDir = join(WORKSPACE, 'container-project');
    mkdirSync(join(projectDir, '.promptscript'), { recursive: true });
    writeFileSync(
      join(projectDir, 'promptscript.yaml'),
      [
        'id: container',
        'syntax: 1.5.0',
        'targets:',
        '  - factory:',
        '      version: full',
        '      rulesMode: split',
        '',
      ].join('\n')
    );
    writeFileSync(
      join(projectDir, '.promptscript/project.prs'),
      [
        '@meta {',
        '  id: "container"',
        '  syntax: "1.5.0"',
        '}',
        '@restrictions {',
        '  - "First rule"',
        '}',
        '',
      ].join('\n')
    );

    const containerName = 'prs-deno-smoke';
    const build = await run(
      runtime,
      [
        'run',
        '--rm',
        '--name',
        containerName,
        '-v',
        `${WORKSPACE}:/work`,
        '-w',
        '/work',
        'debian:bookworm-slim',
        '/bin/bash',
        '-c',
        [
          'set -e',
          'bin_id="/work/prs-bin-linux-' + hostArch + '"',
          '"$bin_id" --version',
          'cd /work/container-project',
          '"$bin_id" compile',
          'test -f .factory/rules/restrictions.md',
          String.raw`printf "USER OWNED\n" > .factory/rules/user-owned.md`,
          'cat > .promptscript/project.prs << "PRSEOF"',
          '@meta {',
          '  id: "container"',
          '  syntax: "1.5.0"',
          '}',
          'PRSEOF',
          '"$bin_id" compile',
          'test ! -e .factory/rules/restrictions.md',
          'grep -q "USER OWNED" .factory/rules/user-owned.md',
          'command -v node && exit 1 || true',
          `test "$("$bin_id" --version)" = "${version}"`,
          'echo CONTAINER-SMOKE-OK',
        ].join('\n'),
      ],
      { timeoutMs: 300_000 }
    );
    assert(
      build.code === 0 && build.stdout.includes('CONTAINER-SMOKE-OK'),
      `container smoke failed: ${build.stderr}${build.stdout}`
    );
  });
}

await main();
