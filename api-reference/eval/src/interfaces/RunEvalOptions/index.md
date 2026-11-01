# RunEvalOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: RunEvalOptions

Defined in: [eval/src/run.ts:58](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L58)

Options of [runEval](https://getpromptscript.dev/api-reference/eval/src/functions/runEval/index.md).

## Properties

### allowedPatterns?

> `optional` **allowedPatterns?**: readonly `string`[]

Defined in: [eval/src/run.ts:87](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L87)

`validation.allowedPatterns` of the project, for the dataset scan

***

### budget?

> `optional` **budget?**: `object`

Defined in: [eval/src/run.ts:77](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L77)

Spending limit in USD; required by every mode that calls a provider

#### maxCostUsd

> **maxCostUsd**: `number`

***

### bundles

> **bundles**: readonly [`PromptBundleV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptBundleV1/index.md)[]

Defined in: [eval/src/run.ts:64](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L64)

Prompt bundles the project compiles; each is verified again before use

***

### cache

> **cache**: `object`

Defined in: [eval/src/run.ts:75](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L75)

Cache mode and directory, relative to the project root

#### dir

> **dir**: `string`

#### mode

> **mode**: [`EvalCacheMode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalCacheMode/index.md)

***

### catalog

> **catalog**: [`ModelCatalog`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelCatalog/index.md)

Defined in: [eval/src/run.ts:71](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L71)

Model catalog with the project's profiles

***

### concurrency?

> `optional` **concurrency?**: `number`

Defined in: [eval/src/run.ts:81](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L81)

Calls in flight at once; default 4, at most 16

***

### maxCases?

> `optional` **maxCases?**: `number`

Defined in: [eval/src/run.ts:79](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L79)

Row limit of a dataset; default 1000

***

### maxOutputTokens?

> `optional` **maxOutputTokens?**: `number`

Defined in: [eval/src/run.ts:83](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L83)

Output token cap when a prompt sets no `maxTokens`; default 1024

***

### modelOverride?

> `optional` **modelOverride?**: `string`

Defined in: [eval/src/run.ts:85](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L85)

Run every suite on this model only

***

### onProgress?

> `optional` **onProgress?**: (`event`) => `void`

Defined in: [eval/src/run.ts:91](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L91)

Receives warnings and finished cases; after it throws once it gets no more

#### Parameters

##### event

[`EvalProgress`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalProgress/index.md)

#### Returns

`void`

***

### projectRoot

> **projectRoot**: `string`

Defined in: [eval/src/run.ts:60](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L60)

Project root directory

***

### providers

> **providers**: [`EvalProviderLookup`](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalProviderLookup/index.md)

Defined in: [eval/src/run.ts:73](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L73)

Provider of a name; called only for calls the cache cannot answer

***

### retryBaseMs?

> `optional` **retryBaseMs?**: `number`

Defined in: [eval/src/run.ts:93](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L93)

First retry delay in milliseconds when a provider gives none; default 500

***

### rubrics?

> `optional` **rubrics?**: readonly [`PromptBundleV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptBundleV1/index.md)[]

Defined in: [eval/src/run.ts:69](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L69)

Bundles judge rubrics are looked up in; defaults to `bundles`. A rubric is not the
prompt under test, so it may come from another source than the tested prompt.

***

### signal?

> `optional` **signal?**: `AbortSignal`

Defined in: [eval/src/run.ts:89](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L89)

Stops new calls; finished cases stay in the report

***

### suites

> **suites**: readonly [`LoadedSuite`](https://getpromptscript.dev/api-reference/eval/src/interfaces/LoadedSuite/index.md)[]

Defined in: [eval/src/run.ts:62](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L62)

Suites from `loadSuites`