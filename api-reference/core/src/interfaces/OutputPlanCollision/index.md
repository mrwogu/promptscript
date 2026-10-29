# OutputPlanCollision

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: OutputPlanCollision

Defined in: [core/src/output-plan.ts:70](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/output-plan.ts#L70)

Collision observed while constructing an output plan.

## Properties

### existingOwner

> **existingOwner**: `string`

Defined in: [core/src/output-plan.ts:74](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/output-plan.ts#L74)

Owner of the already selected artifact.

***

### identical

> **identical**: `boolean`

Defined in: [core/src/output-plan.ts:80](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/output-plan.ts#L80)

Whether write semantics are identical.

***

### incomingOwner

> **incomingOwner**: `string`

Defined in: [core/src/output-plan.ts:76](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/output-plan.ts#L76)

Owner of the incoming artifact.

***

### incomingRole

> **incomingRole**: [`OutputPlanArtifactRole`](https://getpromptscript.dev/api-reference/core/src/type-aliases/OutputPlanArtifactRole/index.md)

Defined in: [core/src/output-plan.ts:78](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/output-plan.ts#L78)

Role of the incoming artifact.

***

### path

> **path**: `string`

Defined in: [core/src/output-plan.ts:72](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/output-plan.ts#L72)

Normalized colliding path.

***

### resolution

> **resolution**: [`OutputPlanCollisionResolution`](https://getpromptscript.dev/api-reference/core/src/type-aliases/OutputPlanCollisionResolution/index.md)

Defined in: [core/src/output-plan.ts:82](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/output-plan.ts#L82)

Deterministic resolution applied by the planner.