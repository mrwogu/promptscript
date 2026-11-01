# EvalPlan

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalPlan

Defined in: [eval/src/run.ts:1040](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/run.ts#L1040)

What a run would do, without any call.

## Properties

### budgetUsd?

> `optional` **budgetUsd?**: `number`

Defined in: [eval/src/run.ts:1054](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/run.ts#L1054)

The `--max-cost` limit, when given

***

### calls

> **calls**: `number`

Defined in: [eval/src/run.ts:1046](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/run.ts#L1046)

***

### errors

> **errors**: [`EvalFinding`](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalFinding/index.md)[]

Defined in: [eval/src/run.ts:1056](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/run.ts#L1056)

Setup errors: the same a run would stop at

***

### hits

> **hits**: `number`

Defined in: [eval/src/run.ts:1044](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/run.ts#L1044)

***

### judgeCalls?

> `optional` **judgeCalls?**: `number`

Defined in: [eval/src/run.ts:1050](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/run.ts#L1050)

Judge calls a run would make; only when a suite has judge assertions

***

### judgeHits?

> `optional` **judgeHits?**: `number`

Defined in: [eval/src/run.ts:1048](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/run.ts#L1048)

Judge calls the cache answers; only when a suite has judge assertions

***

### misses

> **misses**: `number`

Defined in: [eval/src/run.ts:1045](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/run.ts#L1045)

***

### mode

> **mode**: [`EvalCacheMode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalCacheMode/index.md)

Defined in: [eval/src/run.ts:1041](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/run.ts#L1041)

***

### suites

> **suites**: [`EvalPlanSuite`](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalPlanSuite/index.md)[]

Defined in: [eval/src/run.ts:1043](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/run.ts#L1043)

Empty when setup found errors

***

### worstCaseUsd?

> `optional` **worstCaseUsd?**: `number`

Defined in: [eval/src/run.ts:1052](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/run.ts#L1052)

Worst case of every planned call in USD, when a budget applies