# OutputPlanCollision

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: OutputPlanCollision

Defined in: [core/src/output-plan.ts:65](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/output-plan.ts#L65)

Collision observed while constructing an output plan.

## Properties

### existingOwner

> **existingOwner**: `string`

Defined in: [core/src/output-plan.ts:69](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/output-plan.ts#L69)

Owner of the already selected artifact.

***

### identical

> **identical**: `boolean`

Defined in: [core/src/output-plan.ts:75](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/output-plan.ts#L75)

Whether write semantics are identical.

***

### incomingOwner

> **incomingOwner**: `string`

Defined in: [core/src/output-plan.ts:71](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/output-plan.ts#L71)

Owner of the incoming artifact.

***

### incomingRole

> **incomingRole**: [`OutputPlanArtifactRole`](https://getpromptscript.dev/api-reference/core/src/type-aliases/OutputPlanArtifactRole/index.md)

Defined in: [core/src/output-plan.ts:73](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/output-plan.ts#L73)

Role of the incoming artifact.

***

### path

> **path**: `string`

Defined in: [core/src/output-plan.ts:67](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/output-plan.ts#L67)

Normalized colliding path.

***

### resolution

> **resolution**: [`OutputPlanCollisionResolution`](https://getpromptscript.dev/api-reference/core/src/type-aliases/OutputPlanCollisionResolution/index.md)

Defined in: [core/src/output-plan.ts:77](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/output-plan.ts#L77)

Deterministic resolution applied by the planner.