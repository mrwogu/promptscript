# OutputPlanCandidate

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: OutputPlanCandidate

Defined in: [core/src/output-plan.ts:38](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/output-plan.ts#L38)

A formatter artifact submitted to the planner.

## Properties

### output

> **output**: [`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md)

Defined in: [core/src/output-plan.ts:40](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/output-plan.ts#L40)

Artifact to flatten into the plan.

***

### owner

> **owner**: `string`

Defined in: [core/src/output-plan.ts:42](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/output-plan.ts#L42)

Formatter or adapter that owns the artifact.

***

### role?

> `optional` **role?**: [`OutputPlanArtifactRole`](https://getpromptscript.dev/api-reference/core/src/type-aliases/OutputPlanArtifactRole/index.md)

Defined in: [core/src/output-plan.ts:44](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/output-plan.ts#L44)

Collision precedence role. Defaults to primary.