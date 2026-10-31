import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { parse } from 'yaml';
import { createMockProvider, type MockAnswer } from '@promptscript/eval';
import { defaultFileSystem, defaultPrompts } from '../services.js';
import { evalRunCommand, type EvalCommandServices } from '../commands/eval/run.js';

const REPO = new URL('../../../../', import.meta.url).pathname;
const RECIPE = join(REPO, 'examples', 'workflows', 'prompt-drift.yml');
const GUIDE = join(REPO, 'docs', 'guides', 'ci.md');
const EXAMPLE = join(REPO, 'examples', 'runtime-node');
const PROMPTSCRIPT = '.promptscript';
const BASELINE = join(PROMPTSCRIPT, 'eval-reports', 'prod-baseline.json');
const GENERATED = [join(PROMPTSCRIPT, 'eval-cache'), join(PROMPTSCRIPT, 'eval-reports')];
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

const recipeText = readFileSync(RECIPE, 'utf8');
const workflow = parse(recipeText) as Workflow;
const steps = workflow.jobs.drift.steps;

function stepById(id: string): Step {
  const step = steps.find((candidate) => candidate.id === id);
  if (step === undefined) throw new Error(`the recipe has no step with id ${id}`);
  return step;
}

function stepUsing(action: string): Step {
  const step = steps.find((candidate) => candidate.uses?.startsWith(`${action}@`));
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

const noNetwork = vi.fn(() => {
  throw new Error('no network in the drift example check');
});

function services(patch: Partial<EvalCommandServices>): EvalCommandServices {
  return { fs: defaultFileSystem, prompts: defaultPrompts, cwd: process.cwd(), env: {}, ...patch };
}

/** The example without the files the test writes, in a temp directory. */
async function freshCopy(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'promptscript-drift-example-'));
  roots.push(root);
  cpSync(EXAMPLE, root, {
    recursive: true,
    filter: (source) => !GENERATED.some((dir) => source === join(EXAMPLE, dir)),
  });
  mkdirSync(join(root, PROMPTSCRIPT, 'eval-reports'), { recursive: true });
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
  return new Map([...files].sort(([a], [b]) => a.localeCompare(b)));
}

function replaceCommitted(copy: string): void {
  for (const dir of GENERATED) {
    rmSync(join(EXAMPLE, dir), { recursive: true, force: true });
    cpSync(join(copy, dir), join(EXAMPLE, dir), { recursive: true });
  }
}

beforeEach(() => {
  vi.stubGlobal('fetch', noNetwork);
  noNetwork.mockClear();
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  process.exitCode = undefined;
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

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
    );
    const baseline = JSON.parse(readFileSync(join(copy, BASELINE), 'utf8'));
    expect(baseline.suites[0].prompt.contentHash).toBe(label.prompts[0].contentHash);
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

    expect(triggers.sort((a, b) => a.localeCompare(b))).toEqual(['schedule', 'workflow_dispatch']);
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
    expect(run).toContain('--baseline .promptscript/eval-reports/prod-baseline.json');
    expect(run).toContain('--fail-on-regression');
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
    expect(Object.keys(job.env).sort((a, b) => a.localeCompare(b))).toEqual([
      'GH_REPO',
      'GH_TOKEN',
    ]);
    expect(job.steps).toHaveLength(1);
    expect(job.steps.map((step) => step.run)).toEqual([ISSUE_RUN]);
    expect(job['timeout-minutes']).toBeGreaterThan(0);
  });

  it('is the same as the block in the guide', () => {
    expect(guideBlock()).toBe(recipeText);
  });
});
