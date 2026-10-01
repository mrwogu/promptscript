# OutputPlan

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: OutputPlan

Defined in: [core/src/output-plan.ts:95](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/output-plan.ts#L95)

Shared, filesystem-independent output plan.

`files` is sorted by normalized path. `outputs` and `owners` use the same
deterministic order. Collision resolution happens before any filesystem
consumer sees the plan.

## Properties

### collisions

> **collisions**: [`OutputPlanCollision`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputPlanCollision/index.md)[]

Defined in: [core/src/output-plan.ts:103](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/output-plan.ts#L103)

All collisions, in candidate traversal order.

***

### files

> **files**: [`OutputPlanFile`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputPlanFile/index.md)[]

Defined in: [core/src/output-plan.ts:97](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/output-plan.ts#L97)

Selected normalized files.

***

### injected

> **injected**: [`OutputPlanFile`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputPlanFile/index.md)[]

Defined in: [core/src/output-plan.ts:109](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/output-plan.ts#L109)

Selected auto-injected files.

***

### managedOutputDirectories

> **managedOutputDirectories**: `string`[]

Defined in: [core/src/output-plan.ts:111](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/output-plan.ts#L111)

Convenience aliases for managed path consumers.

***

### managedOutputFiles

> **managedOutputFiles**: `string`[]

Defined in: [core/src/output-plan.ts:112](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/output-plan.ts#L112)

***

### managedPaths

> **managedPaths**: [`OutputPlanManagedPaths`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputPlanManagedPaths/index.md)

Defined in: [core/src/output-plan.ts:105](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/output-plan.ts#L105)

Managed paths declared by selected files.

***

### outputs

> **outputs**: `Map`\<`string`, [`OutputPlanFile`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputPlanFile/index.md)\>

Defined in: [core/src/output-plan.ts:99](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/output-plan.ts#L99)

Selected files indexed by normalized path.

***

### owners

> **owners**: `Map`\<`string`, `string`\>

Defined in: [core/src/output-plan.ts:101](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/output-plan.ts#L101)

Selected owner indexed by normalized path.

***

### resources

> **resources**: [`OutputPlanFile`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputPlanFile/index.md)[]

Defined in: [core/src/output-plan.ts:107](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/output-plan.ts#L107)

Selected nested resources.