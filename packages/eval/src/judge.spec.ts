import { createHash } from 'node:crypto';
import { hashPromptBundle, type EvalJudgeRuns, type PromptBundleV1 } from '@promptscript/core';
import { loadPrompt } from '@promptscript/runtime';
import { describe, expect, it } from 'vitest';
import { inputsHash } from './cache.js';
import {
  decide,
  judgeCallPlans,
  judgeEstimate,
  judgeInputs,
  judgeSetups,
  readVerdict,
  MAX_JUDGED_BYTES,
  type JudgePlan,
} from './judge.js';
import type { ModelPlan } from './report.js';

const PRICE = { inputUsdPerMillion: 2, outputUsdPerMillion: 4, checkedOn: '2026-10-01' };

function withHash(bundle: Omit<PromptBundleV1, 'contentHash'>): PromptBundleV1 {
  return { ...bundle, contentHash: hashPromptBundle(bundle) } as PromptBundleV1;
}

const base: Omit<PromptBundleV1, 'contentHash' | 'id' | 'messages' | 'inputs'> = {
  $schema: 'https://getpromptscript.dev/schema/prompt-bundle/v1.json',
  description: 'Test prompt',
  governance: {},
  provenance: { entry: '.promptscript/project.prs', segments: [] },
};

const bundle = withHash({
  ...base,
  id: 'acme/refund-reply',
  messages: [{ role: 'user', content: 'Customer wrote: {{input.message}}' }],
  inputs: {
    message: { type: 'string', description: 'Message', required: true },
    tone: { type: 'string', description: 'Tone', default: 'warm', required: false },
  },
  output: {
    type: 'object',
    properties: { decision: { type: 'string' }, reply: { type: 'string' } },
    required: ['decision', 'reply'],
    additionalProperties: false,
  },
});

const FULL_INPUTS = {
  response: { type: 'string', description: 'Reply', required: true },
  case_inputs: { type: 'string', description: 'Inputs', required: true },
  expected: { type: 'string', description: 'Expected', required: true },
  criteria: { type: 'string', description: 'Criteria', required: true },
  boundary: { type: 'string', description: 'Fence', required: true },
} as const;

const FULL_MESSAGES = [
  { role: 'system', content: 'Grade. {{input.criteria}}' },
  {
    role: 'user',
    content:
      '{{input.case_inputs}} {{input.expected}} <r-{{input.boundary}}>{{input.response}}</r-{{input.boundary}}> {{input.response}}',
  },
] as const;

const VERDICT_OUTPUT = {
  type: 'object',
  properties: { verdict: { type: 'string', enum: ['pass', 'fail'] }, reason: { type: 'string' } },
  required: ['reason', 'verdict'],
  additionalProperties: false,
} as const;

function rubricOf(patch: Partial<Omit<PromptBundleV1, 'contentHash'>> = {}): PromptBundleV1 {
  return withHash({
    ...base,
    id: 'acme/judge',
    messages: [...FULL_MESSAGES],
    inputs: { ...FULL_INPUTS },
    output: { ...VERDICT_OUTPUT },
    ...patch,
  } as Omit<PromptBundleV1, 'contentHash'>);
}

const model: ModelPlan = {
  ref: 'judge-model',
  provider: 'anthropic',
  apiId: 'judge-api',
  params: { maxTokens: 50 },
  maxOutputTokens: 50,
  pricing: PRICE,
};
const caseModel: ModelPlan = { ...model, ref: 'case-model', maxOutputTokens: 100 };

function planOf(
  rubric = rubricOf(),
  patch: Partial<JudgePlan> = {},
  assertion: Partial<JudgePlan['assertion']> = {}
): JudgePlan {
  return {
    assertion: { id: 'tone', kind: 'llm-judge', rubric: rubric.id, ...assertion },
    rubric,
    prompt: loadPrompt(rubric),
    model,
    runs: 3,
    ...patch,
  };
}

const row = {
  id: 'late',
  inputs: { message: 'Late parcel' },
  expected: { decision: 'refund' },
};

describe('judgeInputs', () => {
  it('passes only the inputs the rubric declares', () => {
    const rubric = rubricOf({
      inputs: { response: FULL_INPUTS.response },
      messages: [{ role: 'user', content: '{{input.response}}' }],
    });

    const values = judgeInputs(planOf(rubric), bundle, row, 'hello');

    expect(values).toEqual({ response: 'hello' });
  });

  it('gives the case inputs as canonical JSON after defaults, whatever the key order', () => {
    const one = judgeInputs(planOf(), bundle, row, 'x');
    const two = judgeInputs(
      planOf(),
      bundle,
      { ...row, inputs: { tone: 'warm', message: 'Late parcel' } },
      'x'
    );

    expect(one['case_inputs']).toBe('{"message":"Late parcel","tone":"warm"}');
    expect(two['case_inputs']).toBe(one['case_inputs']);
  });

  it('gives an empty expected value when the row has none, else canonical JSON', () => {
    const none = judgeInputs(planOf(), bundle, { id: 'a', inputs: { message: 'm' } }, 'x');
    const text = judgeInputs(planOf(), bundle, { ...row, expected: 'refund' }, 'x');
    const object = judgeInputs(planOf(), bundle, { ...row, expected: { b: 'two', a: 'one' } }, 'x');

    expect(none['expected']).toBe('');
    expect(text['expected']).toBe('"refund"');
    expect(object['expected']).toBe('{"a":"one","b":"two"}');
  });

  it('gives the criteria, empty without one', () => {
    const none = judgeInputs(planOf(), bundle, row, 'x');
    const given = judgeInputs(planOf(rubricOf(), {}, { criteria: 'Be brief' }), bundle, row, 'x');

    expect(none['criteria']).toBe('');
    expect(given['criteria']).toBe('Be brief');
  });

  it('uses the first 16 hex characters of the SHA-256 of the response as the boundary', () => {
    const values = judgeInputs(planOf(), bundle, row, 'the response');

    expect(values['boundary']).toBe(
      createHash('sha256').update('the response').digest('hex').slice(0, 16)
    );
  });
});

describe('judgeCallPlans', () => {
  const keyOf = (plan: JudgePlan, target = 'x', sample = 0): string =>
    judgeCallPlans(plan, bundle, row, target)[sample]?.key ?? '';

  it('makes one call per run with samples from 1', () => {
    const calls = judgeCallPlans(
      planOf(rubricOf(), { runs: 5 as EvalJudgeRuns }),
      bundle,
      row,
      'x'
    );

    expect(calls.map((call) => call.cacheRequest.sample)).toEqual([1, 2, 3, 4, 5]);
    expect(new Set(calls.map((call) => call.key)).size).toBe(5);
  });

  it('keeps the entries of the first runs when the runs are raised', () => {
    const three = judgeCallPlans(planOf(), bundle, row, 'x');
    const five = judgeCallPlans(planOf(rubricOf(), { runs: 5 }), bundle, row, 'x');

    expect(five.slice(0, 3).map((call) => call.key)).toEqual(three.map((call) => call.key));
  });

  it('builds the request from the rubric, the judge model and its output contract', () => {
    const [call] = judgeCallPlans(planOf(), bundle, row, 'x');

    expect(call?.request).toMatchObject({
      promptId: 'acme/judge',
      provider: 'anthropic',
      apiId: 'judge-api',
      modelRef: 'judge-model',
      params: { maxTokens: 50 },
      maxOutputTokens: 50,
      output: VERDICT_OUTPUT,
    });
    expect(call?.cacheRequest).toMatchObject({
      contentHash: rubricOf().contentHash,
      modelRef: 'judge-model',
      params: { maxTokens: 50 },
    });
    expect(call?.worstCaseUsd).toBeGreaterThan(0);
  });

  it('has no worst case without a price', () => {
    const [call] = judgeCallPlans(
      planOf(rubricOf(), { model: { ...model, pricing: undefined } }),
      bundle,
      row,
      'x'
    );

    expect(call?.worstCaseUsd).toBe(0);
  });

  it('changes the key with the response, the rubric, the judge model, the params and the criteria', () => {
    const reference = keyOf(planOf());

    const changed = [
      keyOf(planOf(), 'y'),
      keyOf(planOf(rubricOf({ description: 'Another' }))),
      keyOf(planOf(rubricOf(), { model: { ...model, ref: 'other' } })),
      keyOf(planOf(rubricOf(), { model: { ...model, params: { maxTokens: 51 } } })),
      keyOf(planOf(rubricOf(), {}, { criteria: 'Be brief' })),
      keyOf(planOf(), 'x', 1),
    ];

    expect(changed.every((key) => key !== reference)).toBe(true);
    expect(new Set(changed).size).toBe(changed.length);
  });

  it('keeps the boundary out of the key', () => {
    const [call] = judgeCallPlans(planOf(), bundle, row, 'same response');
    const values = judgeInputs(planOf(), bundle, row, 'same response');
    const rest = Object.fromEntries(Object.entries(values).filter(([name]) => name !== 'boundary'));

    expect(call?.cacheRequest.inputsHash).toBe(inputsHash(rest));
    expect(Object.keys(rest)).not.toContain('boundary');
  });

  it('gives the same key whatever the order of the row inputs', () => {
    const other = { ...row, inputs: { tone: 'warm', message: 'Late parcel' } };

    expect(judgeCallPlans(planOf(), bundle, other, 'x')[0]?.key).toBe(keyOf(planOf()));
  });
});

describe('judgeSetups', () => {
  it('makes calls for a text target', () => {
    const [setup] = judgeSetups([planOf()], bundle, row, '{"decision":"refund"}');

    expect(setup?.kind).toBe('calls');
  });

  it('reads the field of a JSON response, and non-strings as JSON', () => {
    const plan = planOf(rubricOf(), {}, { field: 'reply' });

    const [text] = judgeSetups([plan], bundle, row, '{"reply":"Hi"}');
    const [number] = judgeSetups([plan], bundle, row, '{"reply":{"a":1}}');

    expect(text?.kind === 'calls' && text.calls[0]?.request.messages[1]?.content).toContain('>Hi<');
    expect(number?.kind === 'calls' && number.calls[0]?.request.messages[1]?.content).toContain(
      '>{"a":1}<'
    );
  });

  it('skips with the reason of the deterministic assertions when there is no target', () => {
    const plan = planOf(rubricOf(), {}, { field: 'reply' });

    const [missing] = judgeSetups([plan], bundle, row, '{"decision":"x"}');
    const [notJson] = judgeSetups([plan], bundle, row, 'plain text');

    expect(missing).toMatchObject({
      kind: 'skipped',
      reason: 'Field "reply" is missing from the response',
    });
    expect(notJson).toMatchObject({ kind: 'skipped', reason: 'Response is not a JSON object' });
  });

  it('refuses a text over 64 KiB and accepts one of exactly 64 KiB', () => {
    const over = 'x'.repeat(MAX_JUDGED_BYTES + 1);
    const exact = 'x'.repeat(MAX_JUDGED_BYTES);

    const [refused] = judgeSetups([planOf()], bundle, row, over);
    const [allowed] = judgeSetups([planOf()], bundle, row, exact);

    expect(refused).toMatchObject({ kind: 'refused', code: 'PS6602' });
    expect(allowed?.kind).toBe('calls');
  });

  it('counts the size in bytes, not characters', () => {
    const wide = 'é'.repeat(MAX_JUDGED_BYTES / 2 + 1);

    const [setup] = judgeSetups([planOf()], bundle, row, wide);

    expect(setup?.kind).toBe('refused');
  });
});

describe('readVerdict', () => {
  it.each([
    ['a valid verdict', '{"verdict":"pass","reason":"Fine"}', 'pass'],
    ['a fail verdict', '{"reason":"No","verdict":"fail"}', 'fail'],
    ['a fenced verdict', '```json\n{"verdict":"pass","reason":"Fine"}\n```', 'pass'],
  ])('reads %s', (_name, text, verdict) => {
    expect(readVerdict(text)?.verdict).toBe(verdict);
  });

  it.each([
    ['an extra key', '{"verdict":"pass","reason":"Fine","score":1}'],
    ['an upper-case verdict', '{"verdict":"PASS","reason":"Fine"}'],
    ['a missing reason', '{"verdict":"pass"}'],
    ['a reason that is not a string', '{"verdict":"pass","reason":1}'],
    ['an unknown verdict', '{"verdict":"unsure","reason":"?"}'],
    ['text that is not JSON', 'pass'],
    ['free text with the word', 'verdict: pass'],
    ['an array', '[{"verdict":"pass","reason":"x"}]'],
    ['a repeated verdict', '{"verdict":"fail","reason":"x","verdict":"pass"}'],
    ['a repeated reason', '{"verdict":"pass","reason":"x","reason":"y"}'],
    ['a repeated key in a fence', '```json\n{"verdict":"fail","verdict":"pass","reason":"x"}\n```'],
    ['a verdict after other text', 'Sure! {"verdict":"pass","reason":"x"}'],
  ])('refuses %s', (_name, text) => {
    expect(readVerdict(text)).toBeUndefined();
  });
});

describe('decide', () => {
  const pass = { verdict: 'pass' as const, reason: 'ok' };
  const fail = { verdict: 'fail' as const, reason: 'rude' };

  it.each([
    [3, [pass, pass, pass], true],
    [3, [pass, pass, fail], true],
    [3, [pass, fail, fail], false],
    [1, [pass], true],
    [1, [fail], false],
    [5, [pass, pass, fail, fail, fail], false],
    [5, [pass, pass, pass, fail, fail], true],
    [3, [pass, pass, undefined], true],
    [5, [pass, pass, undefined, undefined, fail], false],
  ])('with %i runs and %j gives passed %s', (runs, verdicts, passed) => {
    const result = decide(runs, verdicts, 'tone');

    expect(result).toMatchObject({ id: 'tone', kind: 'llm-judge', passed });
  });

  it('is a failure when more than half the runs have no valid verdict', () => {
    const result = decide(3, [pass, undefined, undefined], 'tone');

    expect(result).toMatchObject({ code: 'PS6601' });
    expect('message' in result && result.message).toContain('"tone"');
  });

  it('is not a failure when exactly half of an even count has none', () => {
    const result = decide(5, [pass, pass, pass, undefined, undefined], 'tone');

    expect(result).toMatchObject({ passed: true });
  });

  it('lists the valid verdicts, the runs and the rounded cost', () => {
    const result = decide(3, [pass, undefined, fail], 'tone', 0.0000004);

    expect(result).toMatchObject({
      passed: false,
      judge: { verdicts: ['pass', 'fail'], runs: 3, costUsd: 0 },
    });
  });

  it('leaves the cost out when there is no price', () => {
    const result = decide(1, [pass], 'tone');

    expect('judge' in result && result.judge).toEqual({ verdicts: ['pass'], runs: 1 });
  });

  it('cuts a hostile judge reason to 60 characters and the whole reason to 160', () => {
    const hostile = { verdict: 'fail' as const, reason: `${'A'.repeat(500)}\n"quoted"\u0007` };

    const result = decide(3, [hostile, hostile, hostile], 'tone');

    const reason = 'reason' in result ? (result.reason ?? '') : '';
    expect(reason).toBe(`0 of 3 runs said pass: "${'A'.repeat(60)}..."`);
    expect(reason.length).toBeLessThanOrEqual(160);
  });

  it('keeps the whole reason within 160 characters when quoting escapes grow it', () => {
    const noisy = { verdict: 'fail' as const, reason: '\u0001'.repeat(100) };

    const result = decide(3, [noisy, noisy, noisy], 'tone');

    expect('reason' in result && (result.reason ?? '').length).toBeLessThanOrEqual(160);
  });
});

describe('judgeEstimate', () => {
  it('counts the runs and prices them without a response', () => {
    const { usd, calls } = judgeEstimate([planOf()], bundle, row, caseModel);

    expect(calls).toBe(3);
    expect(usd).toBeGreaterThan(0);
  });

  it('grows with the number of response slots', () => {
    const one = rubricOf({
      messages: [
        {
          role: 'user',
          content: '<r-{{input.boundary}}>{{input.response}}</r-{{input.boundary}}>',
        },
      ],
    });
    const two = rubricOf();

    const small = judgeEstimate([planOf(one)], bundle, row, caseModel).usd;
    const large = judgeEstimate([planOf(two)], bundle, row, caseModel).usd;

    expect(large).toBeGreaterThan(small);
  });

  it('grows with the output cap of the model under test', () => {
    const small = judgeEstimate([planOf()], bundle, row, caseModel).usd;
    const large = judgeEstimate([planOf()], bundle, row, {
      ...caseModel,
      maxOutputTokens: 1000,
    }).usd;

    expect(large).toBeGreaterThan(small);
  });

  it('stops growing at 64 KiB of response', () => {
    const at = judgeEstimate([planOf()], bundle, row, {
      ...caseModel,
      maxOutputTokens: 100_000,
    }).usd;
    const beyond = judgeEstimate([planOf()], bundle, row, {
      ...caseModel,
      maxOutputTokens: 900_000,
    }).usd;

    expect(beyond).toBe(at);
  });

  it('is zero without a price, but still counts the calls', () => {
    const plan = planOf(rubricOf(), { model: { ...model, pricing: undefined } });

    expect(judgeEstimate([plan], bundle, row, caseModel)).toEqual({ usd: 0, calls: 3 });
  });

  it('adds up several judge assertions', () => {
    const one = judgeEstimate([planOf()], bundle, row, caseModel);
    const both = judgeEstimate([planOf(), planOf()], bundle, row, caseModel);

    expect(both.calls).toBe(6);
    expect(both.usd).toBeCloseTo(one.usd * 2, 12);
  });
});
