# EvalPlan

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalPlan

Defined in: [eval/src/run.ts:1019](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/run.ts#L1019)

What a run would do, without any call.

## Properties

### budgetUsd?

> `optional` **budgetUsd?**: `number`

Defined in: [eval/src/run.ts:1029](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/run.ts#L1029)

The `--max-cost` limit, when given

***

### calls

> **calls**: `number`

Defined in: [eval/src/run.ts:1025](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/run.ts#L1025)

***

### errors

> **errors**: [`EvalFinding`](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalFinding/index.md)[]

Defined in: [eval/src/run.ts:1031](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/run.ts#L1031)

Setup errors: the same a run would stop at

***

### hits

> **hits**: `number`

Defined in: [eval/src/run.ts:1023](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/run.ts#L1023)

***

### misses

> **misses**: `number`

Defined in: [eval/src/run.ts:1024](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/run.ts#L1024)

***

### mode

> **mode**: [`EvalCacheMode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalCacheMode/index.md)

Defined in: [eval/src/run.ts:1020](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/run.ts#L1020)

***

### suites

> **suites**: [`EvalPlanSuite`](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalPlanSuite/index.md)[]

Defined in: [eval/src/run.ts:1022](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/run.ts#L1022)

Empty when setup found errors

***

### worstCaseUsd?

> `optional` **worstCaseUsd?**: `number`

Defined in: [eval/src/run.ts:1027](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/run.ts#L1027)

Worst case of every planned call in USD, when a budget applies