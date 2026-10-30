# FormatterOutput

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: FormatterOutput

Defined in: [formatters/src/types.ts:29](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/formatters/src/types.ts#L29)

Output from a formatter.

## Extends

- [`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md)

## Properties

### additionalFiles?

> `optional` **additionalFiles?**: `FormatterOutput`[]

Defined in: [formatters/src/types.ts:39](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/formatters/src/types.ts#L39)

Additional files to generate (e.g., workflows)

#### Overrides

[`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md).[`additionalFiles`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md#additionalfiles)

***

### composition?

> `optional` **composition?**: [`PromptComposition`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptComposition/index.md)[]

Defined in: [formatters/src/types.ts:41](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/formatters/src/types.ts#L41)

Blocks composed into prompts, for the prompt targets. Not part of any written file.

***

### content

> **content**: `string`

Defined in: [core/src/output-plan.ts:14](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/output-plan.ts#L14)

File contents.

#### Inherited from

[`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md).[`content`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md#content)

***

### managedOutputDirectories?

> `optional` **managedOutputDirectories?**: `string`[]

Defined in: [core/src/output-plan.ts:22](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/output-plan.ts#L22)

Relative directories managed by this artifact.

#### Inherited from

[`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md).[`managedOutputDirectories`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md#managedoutputdirectories)

***

### managedOutputFiles?

> `optional` **managedOutputFiles?**: `string`[]

Defined in: [core/src/output-plan.ts:24](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/output-plan.ts#L24)

Relative files managed by this artifact.

#### Inherited from

[`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md).[`managedOutputFiles`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md#managedoutputfiles)

***

### merge?

> `optional` **merge?**: [`StructuredMergePlan`](https://getpromptscript.dev/api-reference/core/src/interfaces/StructuredMergePlan/index.md)

Defined in: [core/src/output-plan.ts:18](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/output-plan.ts#L18)

Optional structured merge instructions.

#### Inherited from

[`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md).[`merge`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md#merge)

***

### mode?

> `optional` **mode?**: `number`

Defined in: [core/src/output-plan.ts:16](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/output-plan.ts#L16)

Optional Unix file mode.

#### Inherited from

[`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md).[`mode`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md#mode)

***

### omit?

> `optional` **omit?**: `boolean`

Defined in: [core/src/output-plan.ts:29](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/output-plan.ts#L29)

Plan nothing for this artifact. A formatter sets it when it has no file to write,
for example a prompt target in a program without prompts.

#### Inherited from

[`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md).[`omit`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md#omit)

***

### path

> **path**: `string`

Defined in: [formatters/src/types.ts:31](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/formatters/src/types.ts#L31)

Output file path (relative to project root)

#### Overrides

[`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md).[`path`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md#path)

***

### source?

> `optional` **source?**: `string`

Defined in: [formatters/src/types.ts:35](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/formatters/src/types.ts#L35)

Source entry used to produce this output.

***

### target?

> `optional` **target?**: `string`

Defined in: [formatters/src/types.ts:33](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/formatters/src/types.ts#L33)

Target formatter that produced this output.

***

### warnings?

> `optional` **warnings?**: [`FormatterWarning`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterWarning/index.md)[]

Defined in: [formatters/src/types.ts:37](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/formatters/src/types.ts#L37)

Target compatibility warnings produced during formatting