# FormatterOutput

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: FormatterOutput

Defined in: [compiler/src/types.ts:21](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L21)

Output from a formatter.

## Extends

- [`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md)

## Properties

### additionalFiles?

> `optional` **additionalFiles?**: `FormatterOutput`[]

Defined in: [compiler/src/types.ts:36](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L36)

Additional files to generate (e.g., .cursor/commands/, .github/prompts/)

#### Overrides

[`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md).[`additionalFiles`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md#additionalfiles)

***

### content

> **content**: `string`

Defined in: [core/src/output-plan.ts:14](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/output-plan.ts#L14)

File contents.

#### Inherited from

[`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md).[`content`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md#content)

***

### managedOutputDirectories?

> `optional` **managedOutputDirectories?**: `string`[]

Defined in: [core/src/output-plan.ts:22](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/output-plan.ts#L22)

Relative directories managed by this artifact.

#### Inherited from

[`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md).[`managedOutputDirectories`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md#managedoutputdirectories)

***

### managedOutputFiles?

> `optional` **managedOutputFiles?**: `string`[]

Defined in: [core/src/output-plan.ts:24](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/output-plan.ts#L24)

Relative files managed by this artifact.

#### Inherited from

[`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md).[`managedOutputFiles`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md#managedoutputfiles)

***

### merge?

> `optional` **merge?**: [`StructuredMergePlan`](https://getpromptscript.dev/api-reference/core/src/interfaces/StructuredMergePlan/index.md)

Defined in: [core/src/output-plan.ts:18](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/output-plan.ts#L18)

Optional structured merge instructions.

#### Inherited from

[`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md).[`merge`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md#merge)

***

### mode?

> `optional` **mode?**: `number`

Defined in: [core/src/output-plan.ts:16](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/output-plan.ts#L16)

Optional Unix file mode.

#### Inherited from

[`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md).[`mode`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md#mode)

***

### path

> **path**: `string`

Defined in: [compiler/src/types.ts:23](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L23)

Output file path

#### Overrides

[`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md).[`path`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md#path)

***

### source?

> `optional` **source?**: `string`

Defined in: [compiler/src/types.ts:27](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L27)

Source entry used to produce this output.

***

### target?

> `optional` **target?**: `string`

Defined in: [compiler/src/types.ts:25](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L25)

Target formatter that produced this output.

***

### warnings?

> `optional` **warnings?**: `object`[]

Defined in: [compiler/src/types.ts:29](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L29)

Target compatibility warnings produced during formatting

#### code

> **code**: `string`

#### location?

> `optional` **location?**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

#### message

> **message**: `string`

#### suggestion?

> `optional` **suggestion?**: `string`