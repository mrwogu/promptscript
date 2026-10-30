# OutputPlan

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: OutputPlan

Defined in: [core/src/output-plan.ts:110](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/output-plan.ts#L110)

Shared, filesystem-independent output plan.

`files` is sorted by normalized path. `outputs` and `owners` use the same
deterministic order. Collision resolution happens before any filesystem
consumer sees the plan.

## Properties

### collisions

> **collisions**: [`OutputPlanCollision`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputPlanCollision/index.md)[]

Defined in: [core/src/output-plan.ts:118](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/output-plan.ts#L118)

All collisions, in candidate traversal order.

***

### files

> **files**: [`OutputPlanFile`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputPlanFile/index.md)[]

Defined in: [core/src/output-plan.ts:112](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/output-plan.ts#L112)

Selected normalized files.

***

### injected

> **injected**: [`OutputPlanFile`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputPlanFile/index.md)[]

Defined in: [core/src/output-plan.ts:124](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/output-plan.ts#L124)

Selected auto-injected files.

***

### managedOutputDirectories

> **managedOutputDirectories**: `string`[]

Defined in: [core/src/output-plan.ts:126](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/output-plan.ts#L126)

Convenience aliases for managed path consumers.

***

### managedOutputFiles

> **managedOutputFiles**: `string`[]

Defined in: [core/src/output-plan.ts:127](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/output-plan.ts#L127)

***

### managedPaths

> **managedPaths**: [`OutputPlanManagedPaths`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputPlanManagedPaths/index.md)

Defined in: [core/src/output-plan.ts:120](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/output-plan.ts#L120)

Managed paths declared by selected files.

***

### omittedManagedDirectories?

> `optional` **omittedManagedDirectories?**: [`OmittedManagedDirectory`](https://getpromptscript.dev/api-reference/core/src/interfaces/OmittedManagedDirectory/index.md)[]

Defined in: [core/src/output-plan.ts:133](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/output-plan.ts#L133)

Managed directories of outputs that formatters omitted, with their owner.
An omitted output writes nothing, but cleanup still needs its directory to remove files
the owner wrote earlier.

***

### outputs

> **outputs**: `Map`\<`string`, [`OutputPlanFile`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputPlanFile/index.md)\>

Defined in: [core/src/output-plan.ts:114](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/output-plan.ts#L114)

Selected files indexed by normalized path.

***

### owners

> **owners**: `Map`\<`string`, `string`\>

Defined in: [core/src/output-plan.ts:116](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/output-plan.ts#L116)

Selected owner indexed by normalized path.

***

### resources

> **resources**: [`OutputPlanFile`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputPlanFile/index.md)[]

Defined in: [core/src/output-plan.ts:122](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/output-plan.ts#L122)

Selected nested resources.