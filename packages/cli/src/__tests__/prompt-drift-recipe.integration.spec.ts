import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from 'yaml';
import { compareCodeUnits } from '@promptscript/core';
import { createMockProvider, type MockAnswer } from '@promptscript/eval';
import { defaultFileSystem, defaultPrompts } from '../services.js';
import { useOfflineEval } from './offline-eval-hooks.js';
import { evalRunCommand, type EvalCommandServices } from '../commands/eval/run.js';

const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const RECIPE = join(REPO, 'examples', 'workflows', 'prompt-drift.yml');
const GUIDE = join(REPO, 'docs', 'guides', 'ci.md');
const EXAMPLE = join(REPO, 'examples', 'runtime-node');
const PROMPTSCRIPT = '.promptscript';
const BASELINE = join(PROMPTSCRIPT, 'eval-baselines', 'prod.json');
const GENERATED = [join(PROMPTSCRIPT, 'eval-cache'), join(PROMPTSCRIPT, 'eval-baselines')];
const UPDATE_COMMAND =
  'UPDATE_DRIFT_EXAMPLE=true pnpm exec vitest run --config packages/cli/vitest.config.mts prompt-drift-recipe';

const answer = (decision: string, inputTokens: number, latencyMs: number): MockAnswer => ({
  text: JSON.stringify({ decision, reply: 'Thanks for writing. Here is what happens next.' }),
  usage: { inputTokens, outputTokens: 18 },
  latencyMs,
});

const ANSWERS: Record<string, MockAnswer> = {
  'broken-kettle': answer('approve', 96, 410),
  'late-return': answer('deny', 94, 380),
  'large-order': answer('escalate', 95, 450),
  'last-day': answer('approve', 94, 400),
};

const JOB_IF =
  "github.event_name == 'schedule' || github.ref == format('refs/heads/{0}', github.event.repository.default_branch)";

const ISSUE_RUN = `title='Scheduled prompt drift check failed'
body="The scheduled prompt drift check failed. The job summary and the report artifact of the run have the details: $GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"
number="$(gh issue list --state open --search "in:title \\"$title\\"" --json number,title --jq ".[] | select(.title == \\"$title\\") | .number" | head -n 1)"
if [ -n "$number" ]; then
  gh issue comment "$number" --body "$body"
else
  gh issue create --title "$title" --body "$body"
fi
`;

interface Step {
  id?: string;
  name?: string;
  uses?: string;
  if?: string;
  env?: Record<string, string>;
  run?: string;
  with?: Record<string, unknown>;
  'timeout-minutes'?: number;
}

interface Workflow {
  on: Record<string, unknown>;
  permissions: Record<string, string>;
  env?: Record<string, string>;
  jobs: {
    drift: {
      if: string;
      environment: string;
      env: Record<string, string>;
      steps: Step[];
      permissions?: unknown;
      'timeout-minutes': number;
    };
    issue: {
      needs: string;
      if: string;
      environment?: unknown;
      env: Record<string, string>;
      steps: Step[];
      permissions: Record<string, string>;
      'timeout-minutes': number;
    };
  };
}

interface LabelFile {
  prompts: { contentHash: string }[];
}

interface BaselineFile {
  suites: { prompt: { contentHash: string } }[];
}

const recipeText = readFileSync(RECIPE, 'utf8');
const workflow = parse(recipeText) as Workflow;
const steps = workflow.jobs.drift.steps;

function stepById(id: string): Step {
  const step = steps.find((candidate) => candidate.id === id);
  if (step === undefined) throw new Error(`the recipe has no step with id ${id}`);
  return step;
}

function stepUsing(action: string): Step {
  const step = steps.find(
    (candidate) => candidate.uses !== undefined && candidate.uses.startsWith(`${action}@`)
  );
  if (step === undefined) throw new Error(`the recipe has no step that uses ${action}`);
  return step;
}

/** The first yaml fence after the heading of the guide section. */
function guideBlock(): string {
  const guide = readFileSync(GUIDE, 'utf8');
  const section = guide.slice(guide.indexOf('### Scheduled drift check'));
  const open = section.indexOf('```yaml\n') + '```yaml\n'.length;
  return section.slice(open, section.indexOf('\n```\n', open) + 1);
}

const roots: string[] = [];

useOfflineEval(roots, 'drift example');

function services(patch: Partial<EvalCommandServices>): EvalCommandServices {
  return { fs: defaultFileSystem, prompts: defaultPrompts, cwd: process.cwd(), env: {}, ...patch };
}

/** The example with the repo node_modules linked in, so the loader resolves its own package. */
function linkedCopy(target: string): void {
  cpSync(EXAMPLE, target, {
    recursive: true,
    filter: (source) => source !== join(EXAMPLE, 'node_modules'),
  });
  symlinkSync(join(REPO, 'node_modules'), join(target, 'node_modules'));
}

/** The example without the files the test writes, in a temp directory. */
async function freshCopy(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'promptscript-drift-example-'));
  roots.push(root);
  cpSync(EXAMPLE, root, {
    recursive: true,
    filter: (source) =>
      source !== join(EXAMPLE, 'node_modules') &&
      !GENERATED.some((dir) => source === join(EXAMPLE, dir)),
  });
  mkdirSync(join(root, PROMPTSCRIPT, 'eval-baselines'), { recursive: true });
  return root;
}

/** Every file under a directory as `relative path -> bytes`, in a fixed order. */
function treeOf(root: string, dir: string): Map<string, string> {
  const files = new Map<string, string>();
  const walk = (current: string): void => {
    if (!existsSync(current)) return;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) walk(path);
      else files.set(relative(root, path), readFileSync(path, 'utf8'));
    }
  };
  walk(join(root, dir));
  return new Map([...files].sort(([a], [b]) => compareCodeUnits(a, b)));
}

function replaceCommitted(copy: string): void {
  for (const dir of GENERATED) {
    rmSync(join(EXAMPLE, dir), { recursive: true, force: true });
    cpSync(join(copy, dir), join(EXAMPLE, dir), { recursive: true });
  }
}

describe('the drift example cache', () => {
  it('is what the CLI records from the scripted answers, with no network', async () => {
    const copy = await freshCopy();
    const mock = createMockProvider(ANSWERS);
    process.exitCode = undefined;

    await evalRunCommand(
      [],
      { cwd: copy, label: 'prod', cache: 'record', maxCost: '1', format: 'json', out: BASELINE },
      services({ createProvider: () => () => mock })
    );

    const code = process.exitCode;
    process.exitCode = undefined;
    expect(code ?? 0).toBe(0);
    expect(mock.calls).toHaveLength(4);
    expect(fetch).not.toHaveBeenCalled();
    const label = JSON.parse(
      readFileSync(join(copy, PROMPTSCRIPT, 'releases', 'prod.json'), 'utf8')
    ) as LabelFile;
    const baseline = JSON.parse(readFileSync(join(copy, BASELINE), 'utf8')) as BaselineFile;
    expect(baseline.suites.map((suite) => suite.prompt.contentHash)).toEqual(
      label.prompts.map((prompt) => prompt.contentHash)
    );
    if (process.env['UPDATE_DRIFT_EXAMPLE'] === 'true') replaceCommitted(copy);
    for (const dir of GENERATED) {
      expect(
        [...treeOf(copy, dir)],
        `${dir} differs from what the CLI writes. Review why, then run: ${UPDATE_COMMAND}`
      ).toEqual([...treeOf(EXAMPLE, dir)]);
    }
  });
});

describe('the prompt drift recipe', () => {
  it('runs on a schedule and by hand only', () => {
    const triggers = Object.keys(workflow.on);

    expect(triggers.sort(compareCodeUnits)).toEqual(['schedule', 'workflow_dispatch']);
    expect(workflow.on['schedule']).toHaveLength(1);
    for (const forbidden of ['push', 'pull_request', 'pull_request_target', 'workflow_run']) {
      expect(triggers).not.toContain(forbidden);
    }
  });

  it('gives the drift job read access to contents and the issue job write access to issues only', () => {
    expect(workflow.permissions).toEqual({ contents: 'read' });
    expect(workflow.jobs.drift.permissions).toBeUndefined();
    expect(workflow.jobs.issue.permissions).toEqual({ issues: 'write' });
  });

  it('runs in the prompt-drift environment, on the default branch', () => {
    expect(workflow.jobs.drift.environment).toBe('prompt-drift');
    expect(workflow.jobs.drift.if).toBe(JOB_IF);
  });

  it('pins every action by commit sha and keeps checkout and setup-node tight', () => {
    const pinned = /^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/;
    const used = steps.filter((step) => step.uses !== undefined);

    expect(used).toHaveLength(3);
    expect(workflow.jobs.issue.steps.filter((step) => step.uses !== undefined)).toHaveLength(0);
    for (const step of used) expect(step.uses).toMatch(pinned);
    for (const line of recipeText.split('\n').filter((text) => text.includes('uses:'))) {
      expect(line).toMatch(/# v\d/);
    }
    expect(stepUsing('actions/checkout').with).toEqual({ 'persist-credentials': false });
    expect(stepUsing('actions/setup-node').with).not.toHaveProperty('cache');
    // setup-node v7 caches by itself when package.json names npm
    expect(stepUsing('actions/setup-node').with).toMatchObject({ 'package-manager-cache': false });
  });

  it('hands the secret to the eval step and to nothing else', () => {
    const others = steps.filter((step) => step.id !== 'eval');

    expect(recipeText.split('secrets.')).toHaveLength(2);
    expect(stepById('eval').env).toEqual({ ANTHROPIC_API_KEY: '${{ secrets.ANTHROPIC_API_KEY }}' });
    expect(JSON.stringify(workflow.env ?? {})).not.toContain('secrets.');
    expect(JSON.stringify(workflow.jobs.drift.env)).not.toContain('secrets.');
    for (const step of others) expect(JSON.stringify(step.env ?? {})).not.toContain('secrets.');
  });

  it('keeps expressions and unpinned installs out of run blocks', () => {
    const all = [...steps, ...workflow.jobs.issue.steps];
    for (const step of all.filter((candidate) => candidate.run !== undefined)) {
      expect(step.run).not.toContain('${{');
      expect(step.run).not.toContain('npx ');
      expect(step.run).not.toContain('npm install');
    }
  });

  it('installs the committed lockfile without lifecycle scripts', () => {
    const run = stepById('install').run ?? '';

    expect(run).toContain('npm ci');
    expect(run).toContain('--ignore-scripts');
  });

  it('calls the CLI by its full path and keeps node_modules/.bin off PATH', () => {
    expect(recipeText).not.toContain('GITHUB_PATH');
    expect(workflow.jobs.drift.env['PRS']).toBe(
      '${{ github.workspace }}/.github/prompt-drift/node_modules/.bin/prs'
    );
    for (const id of ['models', 'eval', 'summary']) {
      expect(stepById(id).run).toContain('"$PRS" ');
      expect(stepById(id).run).not.toMatch(/(^|\s)prs /);
    }
  });

  it('gives the eval step its own time limit, shorter than the job', () => {
    const step = stepById('eval')['timeout-minutes'];

    expect(step).toBeGreaterThan(0);
    expect(step).toBeLessThan(workflow.jobs.drift['timeout-minutes']);
  });

  it('runs the suites live against the label and compares with the baseline', () => {
    const run = stepById('eval').run ?? '';

    expect(run).toContain('--label prod');
    expect(run.match(/--cache off/g)).toHaveLength(1);
    expect(run).toContain('--max-cost ');
    expect(run).toContain('--max-cases ');
    expect(run).toContain('--baseline .promptscript/eval-baselines/prod.json');
    expect(run).toContain('--fail-on-regression');
    expect(run).toContain('--strict');
    expect(run).toContain('--format json');
  });

  it('keeps the report for 90 days and skips a missing file', () => {
    const upload = stepUsing('actions/upload-artifact');

    expect(upload.if).toBe('${{ !cancelled() }}');
    expect(upload.with).toMatchObject({ 'retention-days': 90, 'if-no-files-found': 'ignore' });
  });

  it('opens the issue in a second job with fixed text and the run link only', () => {
    const job = workflow.jobs.issue;

    expect(job.needs).toBe('drift');
    expect(job.if).toBe(`failure() && (${JOB_IF})`);
    expect(job.environment).toBeUndefined();
    expect(Object.keys(job.env).sort(compareCodeUnits)).toEqual(['GH_REPO', 'GH_TOKEN']);
    expect(job.steps).toHaveLength(1);
    expect(job.steps.map((step) => step.run)).toEqual([ISSUE_RUN]);
    expect(job['timeout-minutes']).toBeGreaterThan(0);
  });

  it('is the same as the block in the guide', () => {
    expect(guideBlock()).toBe(recipeText);
  });
});

interface DriftReport {
  outcome: string;
  cache: unknown;
  comparison: unknown;
  usage: unknown;
}

interface StepRun {
  status: number | null;
  output: string;
}

describe.skipIf(process.platform === 'win32')(
  'the recipe on the example, no key and no network',
  () => {
    let home: string;
    let project: string;
    let runner: string;
    let summary: string;
    let env: NodeJS.ProcessEnv;

    beforeAll(async () => {
      home = await mkdtemp(join(tmpdir(), 'promptscript-drift-recipe-'));
      project = join(home, 'project');
      runner = join(home, 'runner');
      summary = join(home, 'summary.md');
      linkedCopy(project);
      mkdirSync(runner);
      mkdirSync(join(home, 'bin'));
      const preload = join(home, 'preload.mjs');
      writeFileSync(
        preload,
        "globalThis.fetch = () => { throw new Error('no network in the drift recipe check'); };\n"
      );
      const register = pathToFileURL(
        join(REPO, 'node_modules', '@swc-node', 'register', 'esm', 'esm-register.mjs')
      ).href;
      const cli = join(REPO, 'packages', 'cli', 'src', 'cli.ts');
      const shim = join(home, 'bin', 'prs');
      writeFileSync(
        shim,
        `#!/bin/sh\nexec node --no-warnings --import ${pathToFileURL(preload).href} --import ${register} ${cli} "$@"\n`
      );
      chmodSync(shim, 0o755);
      env = {
        ...process.env,
        // The recipe calls the CLI by its full path and keeps node_modules/.bin off PATH
        PRS: shim,
        RUNNER_TEMP: runner,
        GITHUB_STEP_SUMMARY: summary,
        PROMPTSCRIPT_NO_UPDATE_CHECK: '1',
        DO_NOT_TRACK: '1',
        // The loader reads the tsconfig of the working directory unless told where it is
        SWC_NODE_PROJECT: join(REPO, 'tsconfig.json'),
      };
      delete env['ANTHROPIC_API_KEY'];
    });

    afterAll(async () => {
      await rm(home, { recursive: true, force: true });
    });

    beforeEach(() => {
      rmSync(join(runner, 'prompt-drift.json'), { force: true });
      rmSync(summary, { force: true });
    });

    /** Run a step the way Actions does: bash with -e and pipefail, in the checkout. */
    function runStep(run: string, extra: NodeJS.ProcessEnv = {}, cwd = project): StepRun {
      const result = spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', '-c', run], {
        cwd,
        env: { ...env, ...extra },
        encoding: 'utf8',
        timeout: 50_000,
      });
      return { status: result.status, output: `${result.stdout}${result.stderr}` };
    }

    const evalRun = (): string => stepById('eval').run ?? '';
    const replayRun = (): string => evalRun().replace('--cache off', '--cache replay');
    const report = (): DriftReport =>
      JSON.parse(readFileSync(join(runner, 'prompt-drift.json'), 'utf8')) as DriftReport;

    it('passes the models check', () => {
      const result = runStep(stepById('models').run ?? '');

      expect(result.status, result.output).toBe(0);
    });

    it('replays the suite from the cache and finds no regression', () => {
      const result = runStep(replayRun());

      expect(result.status, result.output).toBe(0);
      const document = report();
      expect(document.outcome).toBe('passed');
      expect(document.cache).toMatchObject({ live: 0, replayed: 4 });
      expect(document.comparison).toMatchObject({ regression: false });
    });

    it('writes the comparison into the job summary', () => {
      runStep(replayRun());

      const result = runStep(stepById('summary').run ?? '');

      expect(result.status, result.output).toBe(0);
      const text = readFileSync(summary, 'utf8');
      expect(text).toContain('Eval comparison: **no regression**');
      expect(text).toContain('| Suite | Model | Pass rate |');
      expect(text).toContain('refund-reply');
    });

    it('exits 1 and names the case in the summary when a replayed answer regresses', () => {
      const regressed = join(home, 'regressed');
      linkedCopy(regressed);
      const cache = join(regressed, PROMPTSCRIPT, 'eval-cache');
      const entries = readdirSync(cache, { recursive: true, encoding: 'utf8' }).filter((name) =>
        name.endsWith('.json')
      );
      // Turn the deny answer of late-return into an approve, so the decision assertion fails
      const changed = entries.filter((name) => {
        const file = join(cache, name);
        const text = readFileSync(file, 'utf8');
        if (!text.includes('\\"decision\\":\\"deny\\"')) return false;
        writeFileSync(
          file,
          text.replace('\\"decision\\":\\"deny\\"', '\\"decision\\":\\"approve\\"')
        );
        return true;
      });
      expect(changed).toHaveLength(1);

      const result = runStep(replayRun(), {}, regressed);
      const compared = runStep(stepById('summary').run ?? '', {}, regressed);

      expect(result.status, result.output).toBe(1);
      expect(compared.status, compared.output).toBe(0);
      const text = readFileSync(summary, 'utf8');
      expect(text).toContain('Eval comparison: **regression**');
      expect(text).toMatch(/\| `?refund-reply`? \|.*\| `?late-return`? \|/);
    });

    it('exits 2 and names the suite when the baseline has one that was not run', () => {
      const widened = join(home, 'widened');
      linkedCopy(widened);
      const file = join(widened, BASELINE);
      const baseline = JSON.parse(readFileSync(file, 'utf8')) as {
        suites: { name: string; prompt: { id: string } }[];
      };
      const [first] = baseline.suites;
      if (first === undefined) throw new Error('the example baseline has no suite');
      const extra = { ...structuredClone(first), name: 'retired-suite' };
      extra.prompt.id = 'acme-support/retired-suite';
      baseline.suites.push(extra);
      writeFileSync(file, `${JSON.stringify(baseline, null, 2)}\n`);

      const result = runStep(replayRun(), {}, widened);

      expect(result.status, result.output).toBe(2);
      expect(result.output).toContain('only in the baseline, not run');
      expect(result.output).toContain('retired-suite');
      expect(report().outcome).toBe('passed');
    });

    it('fails on a blocked network, so the replay above is not a pass by luck', () => {
      const result = runStep(evalRun(), { ANTHROPIC_API_KEY: 'not-a-key' });

      expect(result.status, result.output).toBe(1);
      expect(report().outcome).toBe('failed');
      expect(JSON.stringify(report())).toContain('PS6300');
      expect(report().usage).toMatchObject({ calls: 0 });
    });

    it('fails with PS6306 and no call when the key is missing', () => {
      const result = runStep(evalRun());

      expect(result.status, result.output).toBe(1);
      expect(JSON.stringify(report())).toContain('PS6306');
    });
  }
);
