# createOutputPlan()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createOutputPlan()

> **createOutputPlan**(`candidates`): [`OutputPlan`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputPlan/index.md)

Defined in: [core/src/output-plan.ts:336](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/output-plan.ts#L336)

Build a deterministic output plan from formatter artifacts.

Primary artifacts replace conflicting earlier artifacts, matching compiler
target precedence. Resources and injected artifacts preserve the first
owner so a nested resource cannot clobber an already selected file.

## Parameters

### candidates

readonly [`OutputPlanCandidate`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputPlanCandidate/index.md)[]

## Returns

[`OutputPlan`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputPlan/index.md)