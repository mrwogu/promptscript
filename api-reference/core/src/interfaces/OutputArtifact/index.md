# OutputArtifact

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: OutputArtifact

Defined in: [core/src/output-plan.ts:10](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/output-plan.ts#L10)

Formatter output shape understood by the shared output planner.

Formatter packages may add fields to this shape, but filesystem consumers
must only depend on these portable fields.

## Extended by

- [`FormatterOutput`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/FormatterOutput/index.md)
- [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

## Properties

### additionalFiles?

> `optional` **additionalFiles?**: `OutputArtifact`[]

Defined in: [core/src/output-plan.ts:20](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/output-plan.ts#L20)

Nested resources emitted with this artifact.

***

### content

> **content**: `string`

Defined in: [core/src/output-plan.ts:14](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/output-plan.ts#L14)

File contents.

***

### managedOutputDirectories?

> `optional` **managedOutputDirectories?**: `string`[]

Defined in: [core/src/output-plan.ts:22](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/output-plan.ts#L22)

Relative directories managed by this artifact.

***

### managedOutputFiles?

> `optional` **managedOutputFiles?**: `string`[]

Defined in: [core/src/output-plan.ts:24](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/output-plan.ts#L24)

Relative files managed by this artifact.

***

### merge?

> `optional` **merge?**: [`StructuredMergePlan`](https://getpromptscript.dev/api-reference/core/src/interfaces/StructuredMergePlan/index.md)

Defined in: [core/src/output-plan.ts:18](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/output-plan.ts#L18)

Optional structured merge instructions.

***

### mode?

> `optional` **mode?**: `number`

Defined in: [core/src/output-plan.ts:16](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/output-plan.ts#L16)

Optional Unix file mode.

***

### path

> **path**: `string`

Defined in: [core/src/output-plan.ts:12](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/output-plan.ts#L12)

Relative output path.