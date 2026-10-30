# RunEvalOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: RunEvalOptions

Defined in: [eval/src/run.ts:58](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/run.ts#L58)

Options of [runEval](https://getpromptscript.dev/api-reference/eval/src/functions/runEval/index.md).

## Properties

### allowedPatterns?

> `optional` **allowedPatterns?**: readonly `string`[]

Defined in: [eval/src/run.ts:82](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/run.ts#L82)

`validation.allowedPatterns` of the project, for the dataset scan

***

### budget?

> `optional` **budget?**: `object`

Defined in: [eval/src/run.ts:72](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/run.ts#L72)

Spending limit in USD; required by every mode that calls a provider

#### maxCostUsd

> **maxCostUsd**: `number`

***

### bundles

> **bundles**: readonly [`PromptBundleV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptBundleV1/index.md)[]

Defined in: [eval/src/run.ts:64](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/run.ts#L64)

Prompt bundles the project compiles; each is verified again before use

***

### cache

> **cache**: `object`

Defined in: [eval/src/run.ts:70](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/run.ts#L70)

Cache mode and directory, relative to the project root

#### dir

> **dir**: `string`

#### mode

> **mode**: [`EvalCacheMode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalCacheMode/index.md)

***

### catalog

> **catalog**: [`ModelCatalog`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelCatalog/index.md)

Defined in: [eval/src/run.ts:66](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/run.ts#L66)

Model catalog with the project's profiles

***

### concurrency?

> `optional` **concurrency?**: `number`

Defined in: [eval/src/run.ts:76](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/run.ts#L76)

Calls in flight at once; default 4, at most 16

***

### maxCases?

> `optional` **maxCases?**: `number`

Defined in: [eval/src/run.ts:74](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/run.ts#L74)

Row limit of a dataset; default 1000

***

### maxOutputTokens?

> `optional` **maxOutputTokens?**: `number`

Defined in: [eval/src/run.ts:78](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/run.ts#L78)

Output token cap when a prompt sets no `maxTokens`; default 1024

***

### modelOverride?

> `optional` **modelOverride?**: `string`

Defined in: [eval/src/run.ts:80](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/run.ts#L80)

Run every suite on this model only

***

### onProgress?

> `optional` **onProgress?**: (`event`) => `void`

Defined in: [eval/src/run.ts:86](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/run.ts#L86)

Receives warnings and finished cases; after it throws once it gets no more

#### Parameters

##### event

[`EvalProgress`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalProgress/index.md)

#### Returns

`void`

***

### projectRoot

> **projectRoot**: `string`

Defined in: [eval/src/run.ts:60](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/run.ts#L60)

Project root directory

***

### providers

> **providers**: [`EvalProviderLookup`](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalProviderLookup/index.md)

Defined in: [eval/src/run.ts:68](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/run.ts#L68)

Provider of a name; called only for calls the cache cannot answer

***

### retryBaseMs?

> `optional` **retryBaseMs?**: `number`

Defined in: [eval/src/run.ts:88](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/run.ts#L88)

First retry delay in milliseconds when a provider gives none; default 500

***

### signal?

> `optional` **signal?**: `AbortSignal`

Defined in: [eval/src/run.ts:84](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/run.ts#L84)

Stops new calls; finished cases stay in the report

***

### suites

> **suites**: readonly [`LoadedSuite`](https://getpromptscript.dev/api-reference/eval/src/interfaces/LoadedSuite/index.md)[]

Defined in: [eval/src/run.ts:62](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/run.ts#L62)

Suites from `loadSuites`