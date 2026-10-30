# EvalPlan

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalPlan

Defined in: [eval/src/run.ts:1032](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/run.ts#L1032)

What a run would do, without any call.

## Properties

### budgetUsd?

> `optional` **budgetUsd?**: `number`

Defined in: [eval/src/run.ts:1046](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/run.ts#L1046)

The `--max-cost` limit, when given

***

### calls

> **calls**: `number`

Defined in: [eval/src/run.ts:1038](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/run.ts#L1038)

***

### errors

> **errors**: [`EvalFinding`](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalFinding/index.md)[]

Defined in: [eval/src/run.ts:1048](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/run.ts#L1048)

Setup errors: the same a run would stop at

***

### hits

> **hits**: `number`

Defined in: [eval/src/run.ts:1036](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/run.ts#L1036)

***

### judgeCalls?

> `optional` **judgeCalls?**: `number`

Defined in: [eval/src/run.ts:1042](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/run.ts#L1042)

Judge calls a run would make; only when a suite has judge assertions

***

### judgeHits?

> `optional` **judgeHits?**: `number`

Defined in: [eval/src/run.ts:1040](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/run.ts#L1040)

Judge calls the cache answers; only when a suite has judge assertions

***

### misses

> **misses**: `number`

Defined in: [eval/src/run.ts:1037](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/run.ts#L1037)

***

### mode

> **mode**: [`EvalCacheMode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalCacheMode/index.md)

Defined in: [eval/src/run.ts:1033](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/run.ts#L1033)

***

### suites

> **suites**: [`EvalPlanSuite`](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalPlanSuite/index.md)[]

Defined in: [eval/src/run.ts:1035](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/run.ts#L1035)

Empty when setup found errors

***

### worstCaseUsd?

> `optional` **worstCaseUsd?**: `number`

Defined in: [eval/src/run.ts:1044](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/run.ts#L1044)

Worst case of every planned call in USD, when a budget applies