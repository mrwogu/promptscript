# EvalReportV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalReportV1

Defined in: [core/src/types/eval.ts:821](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L821)

Report of one eval run, version 1. Deterministic: no timestamps, no
wall-clock durations, no absolute paths, arrays sorted by suite name,
model order and case id.

## Properties

### $schema

> **$schema**: `"https://getpromptscript.dev/schema/eval-report/v1.json"`

Defined in: [core/src/types/eval.ts:826](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L826)

Schema URL, the version tag of the report.

#### Example

```ts
"https://getpromptscript.dev/schema/eval-report/v1.json"
```

***

### budget?

> `optional` **budget?**: [`EvalBudgetV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalBudgetV1/index.md)

Defined in: [core/src/types/eval.ts:846](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L846)

Budget of the run, when one applied

***

### cache

> **cache**: [`EvalReportCacheV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalReportCacheV1/index.md)

Defined in: [core/src/types/eval.ts:837](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L837)

Cache summary

***

### comparison?

> `optional` **comparison?**: [`EvalComparisonV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalComparisonV1/index.md)

Defined in: [core/src/types/eval.ts:850](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L850)

Comparison against a baseline report

***

### costUsd?

> `optional` **costUsd?**: `number`

Defined in: [core/src/types/eval.ts:844](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L844)

Cost of the run in USD, when every model used has a price.

#### Minimum

0

***

### errors

> **errors**: [`EvalReportErrorV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalReportErrorV1/index.md)[]

Defined in: [core/src/types/eval.ts:852](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L852)

Errors not tied to one case

***

### outcome

> **outcome**: [`EvalOutcome`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalOutcome/index.md)

Defined in: [core/src/types/eval.ts:833](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L833)

Outcome of the run

***

### passed

> **passed**: `boolean`

Defined in: [core/src/types/eval.ts:835](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L835)

Whether every suite passed and nothing else went wrong

***

### suites

> **suites**: [`EvalSuiteResultV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalSuiteResultV1/index.md)[]

Defined in: [core/src/types/eval.ts:848](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L848)

Suite results sorted by name

***

### usage

> **usage**: [`EvalUsageV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalUsageV1/index.md)

Defined in: [core/src/types/eval.ts:839](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L839)

Calls and tokens of the run

***

### version?

> `optional` **version?**: `1`

Defined in: [core/src/types/eval.ts:831](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L831)

Format version, always 1 in reports this CLI writes. Older reports lack
it; read a missing value as 1.