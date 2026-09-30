# OutputPlanCandidate

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: OutputPlanCandidate

Defined in: [core/src/output-plan.ts:33](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/output-plan.ts#L33)

A formatter artifact submitted to the planner.

## Properties

### output

> **output**: [`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md)

Defined in: [core/src/output-plan.ts:35](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/output-plan.ts#L35)

Artifact to flatten into the plan.

***

### owner

> **owner**: `string`

Defined in: [core/src/output-plan.ts:37](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/output-plan.ts#L37)

Formatter or adapter that owns the artifact.

***

### role?

> `optional` **role?**: [`OutputPlanArtifactRole`](https://getpromptscript.dev/api-reference/core/src/type-aliases/OutputPlanArtifactRole/index.md)

Defined in: [core/src/output-plan.ts:39](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/output-plan.ts#L39)

Collision precedence role. Defaults to primary.