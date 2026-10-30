# FormatterOutput

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: FormatterOutput

Defined in: [compiler/src/types.ts:23](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/compiler/src/types.ts#L23)

Output from a formatter.

## Extends

- [`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md)

## Properties

### additionalFiles?

> `optional` **additionalFiles?**: `FormatterOutput`[]

Defined in: [compiler/src/types.ts:38](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/compiler/src/types.ts#L38)

Additional files to generate (e.g., .cursor/commands/, .github/prompts/)

#### Overrides

[`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md).[`additionalFiles`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md#additionalfiles)

***

### composition?

> `optional` **composition?**: [`PromptComposition`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptComposition/index.md)[]

Defined in: [compiler/src/types.ts:40](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/compiler/src/types.ts#L40)

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

Defined in: [compiler/src/types.ts:25](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/compiler/src/types.ts#L25)

Output file path

#### Overrides

[`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md).[`path`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md#path)

***

### source?

> `optional` **source?**: `string`

Defined in: [compiler/src/types.ts:29](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/compiler/src/types.ts#L29)

Source entry used to produce this output.

***

### target?

> `optional` **target?**: `string`

Defined in: [compiler/src/types.ts:27](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/compiler/src/types.ts#L27)

Target formatter that produced this output.

***

### warnings?

> `optional` **warnings?**: `object`[]

Defined in: [compiler/src/types.ts:31](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/compiler/src/types.ts#L31)

Target compatibility warnings produced during formatting

#### code

> **code**: `string`

#### location?

> `optional` **location?**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

#### message

> **message**: `string`

#### suggestion?

> `optional` **suggestion?**: `string`