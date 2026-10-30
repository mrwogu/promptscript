import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeBundle, type Json } from './__tests__/fixture.js';
import { createPromptClient } from './client.js';
import { PromptRuntimeError } from './errors.js';
import { sha256Hex } from './internal/sha256.js';
import type { PromptClient, PromptClientOptions, PromptSource } from './types.js';

interface VectorArm {
  variant: string;
  weight: number;
}

interface AssignmentVectors {
  cases: {
    name: string;
    experiment: string;
    id: string;
    key: string;
    arms: VectorArm[];
    bucket: number;
    variant: string;
  }[];
  separators: {
    description: string;
    a: { experiment: string; id: string; key: string; bucket: number };
    b: { experiment: string; id: string; key: string; bucket: number };
  }[];
  invalidKeys: { description: string; key: string }[];
}

interface LabelVectors {
  valid: { name: string; label: unknown }[];
  invalid: { name: string; label: { $schema?: string } }[];
}

const DIR = new URL('../../../conformance/prompt-release-label/v2/', import.meta.url);
const read = <T>(name: string): T => JSON.parse(readFileSync(new URL(name, DIR), 'utf8')) as T;
const assignment = read<AssignmentVectors>('assignment.json');
const labels = read<LabelVectors>('labels.json');

const LABEL_V2 = 'https://getpromptscript.dev/schema/prompt-release-label/v2.json';
const ID = 'acme-support/refund-reply';
const EXPERIMENT = 'warm-tone-2026-11';
const bundlePath = (bundle: Json): string => `bundles/${bundle['contentHash'] as string}.json`;

interface FakeSource extends PromptSource {
  reads: string[];
  files: Map<string, string>;
  down: boolean;
}

function fakeSource(files: Record<string, string>): FakeSource {
  const source: FakeSource = {
    name: 'https://raw.example.com/releases/',
    reads: [],
    files: new Map(Object.entries(files)),
    down: false,
    read: async (path) => {
      source.reads.push(path);
      const text = source.files.get(path);
      if (source.down || text === undefined) throw new Error('unreachable');
      return { text };
    },
  };
  return source;
}

interface Setup {
  source: FakeSource;
  arms: { variant: string; bundle: Json }[];
  label(weights: number[]): string;
}

/** A source with one bundle per arm and a label that runs the experiment on the id. */
function experimentSource(id: string, variants: string[], experiment = EXPERIMENT): Setup {
  const arms = variants.map((variant, index) => ({
    variant,
    bundle: makeBundle({ id, description: index === 0 ? 'Reply to a refund' : `Arm ${variant}` }),
  }));
  const control = arms[0]!.bundle['contentHash'];
  const label = (weights: number[]): string =>
    JSON.stringify({
      $schema: LABEL_V2,
      environment: 'prod',
      prompts: [
        {
          id,
          contentHash: control,
          experiment: {
            name: experiment,
            arms: arms.map((arm, i) => ({
              variant: arm.variant,
              contentHash: arm.bundle['contentHash'],
              weight: weights[i],
            })),
          },
        },
      ],
    });
  const files: Record<string, string> = {};
  for (const arm of arms) files[bundlePath(arm.bundle)] = JSON.stringify(arm.bundle);
  const source = fakeSource(files);
  return { source, arms, label };
}

const clientFor = (
  source: PromptSource,
  options: Partial<PromptClientOptions> = {}
): PromptClient => createPromptClient({ source, label: 'prod', ...options });

const bucketOf = (experiment: string, id: string, key: string): number =>
  parseInt(sha256Hex(`promptscript-assign-v1\0${experiment}\0${id}\0${key}`).slice(0, 8), 16) %
  10_000;

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-30T10:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('assignment vectors', () => {
  it.each(assignment.cases)('$name', async (vector) => {
    // Arrange
    const names = vector.arms.map((arm) => arm.variant);
    const { source, label } = experimentSource(vector.id, names, vector.experiment);
    source.files.set('prod.json', label(vector.arms.map((arm) => arm.weight)));

    // Act
    const prompt = await clientFor(source).get(vector.id, { key: vector.key });

    // Assert
    expect(bucketOf(vector.experiment, vector.id, vector.key)).toBe(vector.bucket);
    expect(prompt.meta.variant).toBe(vector.variant);
    expect(prompt.meta.experiment).toBe(vector.experiment);
  });

  it('never picks a weight 0 arm', () => {
    const zero = assignment.cases.filter((vector) => vector.arms.some((arm) => arm.weight === 0));

    expect(zero.length).toBeGreaterThanOrEqual(2);
    for (const vector of zero) {
      const empty = vector.arms.filter((arm) => arm.weight === 0).map((arm) => arm.variant);
      expect(empty).not.toContain(vector.variant);
    }
  });

  it.each(assignment.separators)('$description', ({ a, b }) => {
    expect(`${a.experiment}${a.id}${a.key}`).toBe(`${b.experiment}${b.id}${b.key}`);
    expect(bucketOf(a.experiment, a.id, a.key)).toBe(a.bucket);
    expect(bucketOf(b.experiment, b.id, b.key)).toBe(b.bucket);
    expect(a.bucket).not.toBe(b.bucket);
  });

  it.each(assignment.invalidKeys)('refuses a key: $description', async ({ key }) => {
    const { source, label } = experimentSource(ID, ['control', 'warm']);
    source.files.set('prod.json', label([9000, 1000]));

    const error = await clientFor(source)
      .get(ID, { key })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(PromptRuntimeError);
    expect(error).toMatchObject({ code: 'invalid-key' });
    expect((error as Error).message).toBe(
      'Assignment key must be 1 to 256 characters without control characters, format characters, line separators or lone surrogates.'
    );
    expect(source.reads).toEqual([]);
  });
});

describe('sticky assignment', () => {
  it('lands 100000 seeded keys within 1 point of each weight', async () => {
    // Arrange
    const weights = [7000, 2000, 1000];
    const { source, label } = experimentSource(ID, ['control', 'warm', 'brief']);
    source.files.set('prod.json', label(weights));
    const prompts = clientFor(source);
    const counts = new Map<string, number>();

    // Act
    for (let i = 0; i < 100_000; i++) {
      const { meta } = await prompts.get(ID, { key: `user-${i}` });
      counts.set(meta.variant!, (counts.get(meta.variant!) ?? 0) + 1);
    }

    // Assert
    expect(Math.abs(counts.get('control')! / 1000 - 70)).toBeLessThan(1);
    expect(Math.abs(counts.get('warm')! / 1000 - 20)).toBeLessThan(1);
    expect(Math.abs(counts.get('brief')! / 1000 - 10)).toBeLessThan(1);
  }, 60_000);

  it('gives the same key the same arm in a new client', async () => {
    const { source, label } = experimentSource(ID, ['control', 'warm']);
    source.files.set('prod.json', label([5000, 5000]));

    const first = await clientFor(source).get(ID, { key: 'user-17' });
    const second = await clientFor(source).get(ID, { key: 'user-17' });

    expect(second.meta.variant).toBe(first.meta.variant);
    expect(second.contentHash).toBe(first.contentHash);
  });

  it('serves the arm bundle and copies experiment and variant into render meta', async () => {
    const { source, label, arms } = experimentSource(ID, ['control', 'warm']);
    source.files.set('prod.json', label([1, 9999]));

    const prompt = await clientFor(source).get(ID, { key: 'k8197' });
    const rendered = prompt.render({ message: 'hi' });

    expect(prompt.meta.variant).toBe('warm');
    expect(prompt.contentHash).toBe(arms[1]!.bundle['contentHash']);
    expect(rendered.meta).toMatchObject({ experiment: EXPERIMENT, variant: 'warm' });
  });

  it('serves the entry hash untagged without a key', async () => {
    const { source, label, arms } = experimentSource(ID, ['control', 'warm']);
    source.files.set('prod.json', label([1, 9999]));

    const prompt = await clientFor(source).get(ID);

    expect(prompt.contentHash).toBe(arms[0]!.bundle['contentHash']);
    expect(prompt.meta).not.toHaveProperty('experiment');
    expect(prompt.meta).not.toHaveProperty('variant');
  });

  it('skips assignment for a pinned ref', async () => {
    const { source, label, arms } = experimentSource(ID, ['control', 'warm']);
    source.files.set('prod.json', label([1, 9999]));
    const hash = arms[0]!.bundle['contentHash'] as string;

    const prompt = await clientFor(source).get(`${ID}@${hash}`, { key: 'k8197' });

    expect(prompt.contentHash).toBe(hash);
    expect(prompt.meta).not.toHaveProperty('variant');
  });

  it('ignores the key when the label has no experiment', async () => {
    const bundle = makeBundle();
    const source = fakeSource({
      'prod.json': JSON.stringify({
        $schema: LABEL_V2,
        environment: 'prod',
        prompts: [{ id: ID, contentHash: bundle['contentHash'] }],
      }),
      [bundlePath(bundle)]: JSON.stringify(bundle),
    });

    const prompt = await clientFor(source).get(ID, { key: 'user-1' });

    expect(prompt.contentHash).toBe(bundle['contentHash']);
    expect(prompt.meta).not.toHaveProperty('variant');
  });

  it('keeps a bundle per arm and reads each once', async () => {
    const { source, label } = experimentSource(ID, ['control', 'warm']);
    source.files.set('prod.json', label([5000, 5000]));
    const prompts = clientFor(source);
    const seen = new Set<string>();

    for (let i = 0; i < 40; i++) {
      seen.add((await prompts.get(ID, { key: `user-${i}` })).meta.variant!);
    }

    expect([...seen].sort()).toEqual(['control', 'warm']);
    expect(source.reads.filter((path) => path.startsWith('bundles/'))).toHaveLength(2);
  });

  it('keeps stale records per arm when the source goes down', async () => {
    // Arrange
    const { source, label } = experimentSource(ID, ['control', 'warm']);
    source.files.set('prod.json', label([5000, 5000]));
    const errors: PromptRuntimeError[] = [];
    const prompts = clientFor(source, { onError: (error) => errors.push(error) });
    const keys = ['k4445', 'k7925'];
    const before = await Promise.all(keys.map((key) => prompts.get(ID, { key })));
    source.down = true;
    vi.setSystemTime(Date.now() + 61_000);

    // Act
    await Promise.all(keys.map((key) => prompts.get(ID, { key })));
    await flush();
    const after = await Promise.all(keys.map((key) => prompts.get(ID, { key })));

    // Assert
    expect(before.map((prompt) => prompt.meta.variant)).toEqual(['control', 'warm']);
    expect(after.map((prompt) => prompt.meta.variant)).toEqual(['control', 'warm']);
    expect(after.every((prompt) => prompt.meta.stale)).toBe(true);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('assigns again from the new label when the experiment ended', async () => {
    // Arrange
    const { source, label, arms } = experimentSource(ID, ['control', 'warm']);
    source.files.set('prod.json', label([1, 9999]));
    const prompts = clientFor(source);
    const first = await prompts.get(ID, { key: 'k8197' });
    const control = arms[0]!.bundle;
    source.files.set(
      'prod.json',
      JSON.stringify({
        $schema: LABEL_V2,
        environment: 'prod',
        prompts: [{ id: ID, contentHash: control['contentHash'] }],
      })
    );
    vi.setSystemTime(Date.now() + 61_000);

    // Act
    await prompts.get(ID, { key: 'k8197' });
    await flush();
    const after = await prompts.get(ID, { key: 'k8197' });

    // Assert
    expect(first.meta.variant).toBe('warm');
    expect(after.contentHash).toBe(control['contentHash']);
    expect(after.meta).not.toHaveProperty('variant');
  });
});

describe('assignment edge cases', () => {
  it('never echoes a refused key', async () => {
    const { source, label } = experimentSource(ID, ['control', 'warm']);
    source.files.set('prod.json', label([9000, 1000]));

    const error = await clientFor(source)
      .get(ID, { key: 'zqxmarker\n' })
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ code: 'invalid-key' });
    expect((error as Error).message).not.toContain('zqxmarker');
  });

  describe.each(['open', 'closed'] as const)(
    'weight change with an unreadable arm, %s mode',
    (mode) => {
      // Arrange
      async function setup() {
        const { source, label, arms } = experimentSource(ID, ['control', 'warm']);
        const warmPath = bundlePath(arms[1]!.bundle);
        const warm = source.files.get(warmPath)!;
        source.files.delete(warmPath);
        source.files.set('prod.json', label([10_000, 0]));
        const errors: PromptRuntimeError[] = [];
        const prompts = clientFor(source, {
          failMode: mode,
          onError: (error) => errors.push(error),
        });
        const first = await prompts.get(ID, { key: 'k8197' });
        source.files.set('prod.json', label([1, 9999]));
        vi.setSystemTime(Date.now() + 61_000);
        return { source, prompts, errors, first, warm, warmPath };
      }

      it('serves the previous arm stale in open mode and throws in closed mode', async () => {
        const { prompts, errors, first } = await setup();

        if (mode === 'closed') {
          await expect(prompts.get(ID, { key: 'k8197' })).rejects.toMatchObject({
            code: 'source-error',
          });
          return;
        }
        const served = [];
        for (let i = 0; i < 3; i++) {
          await flush();
          served.push(await prompts.get(ID, { key: 'k8197' }));
        }

        expect(first.meta.variant).toBe('control');
        expect(served.slice(1).map((prompt) => [prompt.meta.variant, prompt.meta.stale])).toEqual([
          ['control', true],
          ['control', true],
        ]);
        expect(served[2]!.contentHash).toBe(first.contentHash);
        expect(errors.length).toBeGreaterThan(0);
      });

      it.skipIf(mode === 'closed')(
        'keeps serving the previous arm while the label stays unchanged',
        async () => {
          const { prompts, errors } = await setup();

          const served = [];
          for (let i = 0; i < 4; i++) {
            await flush();
            served.push(await prompts.get(ID, { key: 'k8197' }));
            vi.setSystemTime(Date.now() + 61_000);
          }

          expect(served.slice(1).map((prompt) => [prompt.meta.variant, prompt.meta.stale])).toEqual(
            [
              ['control', true],
              ['control', true],
              ['control', true],
            ]
          );
          expect(errors.length).toBeGreaterThanOrEqual(3);
        }
      );

      // Known limit: only the entries before the last change are remembered
      it.skipIf(mode === 'closed')(
        'throws after a second label change with the arm still unreadable',
        async () => {
          const { source, prompts } = await setup();
          await flush();
          await prompts.get(ID, { key: 'k8197' });
          await flush();
          const label = JSON.parse(source.files.get('prod.json')!) as {
            prompts: { experiment: { arms: { weight: number }[] } }[];
          };
          label.prompts[0]!.experiment.arms[0]!.weight = 2;
          label.prompts[0]!.experiment.arms[1]!.weight = 9998;
          source.files.set('prod.json', JSON.stringify(label));
          vi.setSystemTime(Date.now() + 61_000);

          await expect(prompts.get(ID, { key: 'k8197' })).rejects.toMatchObject({
            code: 'source-error',
          });
        }
      );

      it('moves to the new arm once its bundle is readable', async () => {
        const { source, prompts, warm, warmPath } = await setup();
        await flush();
        await prompts.get(ID, { key: 'k8197' }).catch(() => undefined);
        source.files.set(warmPath, warm);

        const prompt = await prompts.get(ID, { key: 'k8197' });

        expect(prompt.meta).toMatchObject({ variant: 'warm', stale: false });
      });
    }
  );

  it('serves a v1 label entry with an experiment key as the plain entry hash', async () => {
    const { source, arms } = experimentSource(ID, ['control', 'warm']);
    const control = arms[0]!.bundle['contentHash'];
    source.files.set(
      'prod.json',
      JSON.stringify({
        $schema: 'https://getpromptscript.dev/schema/prompt-release-label/v1.json',
        environment: 'prod',
        prompts: [
          {
            id: ID,
            contentHash: control,
            experiment: {
              name: EXPERIMENT,
              arms: arms.map((arm, i) => ({
                variant: arm.variant,
                contentHash: arm.bundle['contentHash'],
                weight: i === 0 ? 1 : 9999,
              })),
            },
          },
        ],
      })
    );

    const prompt = await clientFor(source).get(ID, { key: 'k8197' });

    expect(prompt.contentHash).toBe(control);
    expect(prompt.meta).not.toHaveProperty('variant');
  });
});

describe('label versions', () => {
  const V3 = JSON.stringify({
    $schema: 'https://getpromptscript.dev/schema/prompt-release-label/v3.json',
    environment: 'prod',
    prompts: [],
  });

  it('reports unsupported-label and serves stale in open mode', async () => {
    // Arrange
    const { source, label } = experimentSource(ID, ['control', 'warm']);
    source.files.set('prod.json', label([9000, 1000]));
    const errors: PromptRuntimeError[] = [];
    const prompts = clientFor(source, { onError: (error) => errors.push(error) });
    await prompts.get(ID, { key: 'k4445' });
    source.files.set('prod.json', V3);
    vi.setSystemTime(Date.now() + 61_000);

    // Act
    await prompts.get(ID, { key: 'k4445' });
    await flush();
    const prompt = await prompts.get(ID, { key: 'k4445' });

    // Assert
    expect(prompt.meta.stale).toBe(true);
    expect(errors.at(-1)).toMatchObject({ code: 'unsupported-label' });
    expect(errors.at(-1)!.message).toContain('prompt-release-label v3');
    expect(errors.at(-1)!.message).toContain('upgrade @promptscript/runtime');
  });

  it('throws unsupported-label in closed mode', async () => {
    const { source, label } = experimentSource(ID, ['control', 'warm']);
    source.files.set('prod.json', label([9000, 1000]));
    const prompts = clientFor(source, { failMode: 'closed' });
    await prompts.get(ID, { key: 'k4445' });
    source.files.set('prod.json', V3);
    vi.setSystemTime(Date.now() + 61_000);

    await expect(prompts.get(ID, { key: 'k4445' })).rejects.toMatchObject({
      code: 'unsupported-label',
    });
  });

  it('throws unsupported-label on the first load, which has nothing to serve', async () => {
    const source = fakeSource({ 'prod.json': V3 });

    await expect(clientFor(source).get(ID)).rejects.toMatchObject({ code: 'unsupported-label' });
  });

  it.each(labels.valid)('reads the label: $name', async ({ label }) => {
    const source = fakeSource({ 'prod.json': JSON.stringify(label) });

    const error = await clientFor(source)
      .get(ID, { key: 'user-1' })
      .catch((caught: unknown) => caught);

    // The label reads; only the made-up bundle hashes or the missing id are left to fail
    expect(error).not.toMatchObject({ code: 'invalid-index' });
    expect(error).not.toMatchObject({ code: 'unsupported-label' });
  });

  it.each(labels.invalid)('refuses the label: $name', async ({ label }) => {
    const source = fakeSource({ 'prod.json': JSON.stringify(label) });
    const newer = typeof label.$schema === 'string' && label.$schema.endsWith('/v3.json');

    await expect(clientFor(source).get(ID, { key: 'user-1' })).rejects.toMatchObject({
      code: newer ? 'unsupported-label' : 'invalid-index',
    });
  });
});
