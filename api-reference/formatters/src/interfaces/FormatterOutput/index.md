# FormatterOutput

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: FormatterOutput

Defined in: [formatters/src/types.ts:27](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/types.ts#L27)

Output from a formatter.

## Extends

- [`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md)

## Properties

### additionalFiles?

> `optional` **additionalFiles?**: `FormatterOutput`[]

Defined in: [formatters/src/types.ts:37](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/types.ts#L37)

Additional files to generate (e.g., workflows)

#### Overrides

[`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md).[`additionalFiles`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md#additionalfiles)

***

### content

> **content**: `string`

Defined in: [core/src/output-plan.ts:14](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/output-plan.ts#L14)

File contents.

#### Inherited from

[`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md).[`content`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md#content)

***

### managedOutputDirectories?

> `optional` **managedOutputDirectories?**: `string`[]

Defined in: [core/src/output-plan.ts:22](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/output-plan.ts#L22)

Relative directories managed by this artifact.

#### Inherited from

[`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md).[`managedOutputDirectories`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md#managedoutputdirectories)

***

### managedOutputFiles?

> `optional` **managedOutputFiles?**: `string`[]

Defined in: [core/src/output-plan.ts:24](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/output-plan.ts#L24)

Relative files managed by this artifact.

#### Inherited from

[`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md).[`managedOutputFiles`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md#managedoutputfiles)

***

### merge?

> `optional` **merge?**: [`StructuredMergePlan`](https://getpromptscript.dev/api-reference/core/src/interfaces/StructuredMergePlan/index.md)

Defined in: [core/src/output-plan.ts:18](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/output-plan.ts#L18)

Optional structured merge instructions.

#### Inherited from

[`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md).[`merge`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md#merge)

***

### mode?

> `optional` **mode?**: `number`

Defined in: [core/src/output-plan.ts:16](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/output-plan.ts#L16)

Optional Unix file mode.

#### Inherited from

[`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md).[`mode`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md#mode)

***

### path

> **path**: `string`

Defined in: [formatters/src/types.ts:29](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/types.ts#L29)

Output file path (relative to project root)

#### Overrides

[`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md).[`path`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md#path)

***

### source?

> `optional` **source?**: `string`

Defined in: [formatters/src/types.ts:33](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/types.ts#L33)

Source entry used to produce this output.

***

### target?

> `optional` **target?**: `string`

Defined in: [formatters/src/types.ts:31](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/types.ts#L31)

Target formatter that produced this output.

***

### warnings?

> `optional` **warnings?**: [`FormatterWarning`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterWarning/index.md)[]

Defined in: [formatters/src/types.ts:35](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/types.ts#L35)

Target compatibility warnings produced during formatting