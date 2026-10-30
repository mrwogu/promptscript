# EvalReportV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalReportV1

Defined in: [core/src/types/eval.ts:787](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L787)

Report of one eval run, version 1. Deterministic: no timestamps, no
wall-clock durations, no absolute paths, arrays sorted by suite name,
model order and case id.

## Properties

### $schema

> **$schema**: `"https://getpromptscript.dev/schema/eval-report/v1.json"`

Defined in: [core/src/types/eval.ts:792](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L792)

Schema URL, the version tag of the report.

#### Example

```ts
"https://getpromptscript.dev/schema/eval-report/v1.json"
```

***

### budget?

> `optional` **budget?**: [`EvalBudgetV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalBudgetV1/index.md)

Defined in: [core/src/types/eval.ts:807](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L807)

Budget of the run, when one applied

***

### cache

> **cache**: [`EvalReportCacheV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalReportCacheV1/index.md)

Defined in: [core/src/types/eval.ts:798](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L798)

Cache summary

***

### comparison?

> `optional` **comparison?**: [`EvalComparisonV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalComparisonV1/index.md)

Defined in: [core/src/types/eval.ts:811](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L811)

Comparison against a baseline report

***

### costUsd?

> `optional` **costUsd?**: `number`

Defined in: [core/src/types/eval.ts:805](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L805)

Cost of the run in USD, when every model used has a price.

#### Minimum

0

***

### errors

> **errors**: [`EvalReportErrorV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalReportErrorV1/index.md)[]

Defined in: [core/src/types/eval.ts:813](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L813)

Errors not tied to one case

***

### outcome

> **outcome**: [`EvalOutcome`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalOutcome/index.md)

Defined in: [core/src/types/eval.ts:794](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L794)

Outcome of the run

***

### passed

> **passed**: `boolean`

Defined in: [core/src/types/eval.ts:796](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L796)

Whether every suite passed and nothing else went wrong

***

### suites

> **suites**: [`EvalSuiteResultV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalSuiteResultV1/index.md)[]

Defined in: [core/src/types/eval.ts:809](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L809)

Suite results sorted by name

***

### usage

> **usage**: [`EvalUsageV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalUsageV1/index.md)

Defined in: [core/src/types/eval.ts:800](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L800)

Calls and tokens of the run