# OutputPlanFile

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: OutputPlanFile

Defined in: [core/src/output-plan.ts:45](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/output-plan.ts#L45)

One normalized file in an output plan.

## Extends

- `Omit`\<[`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md), `"additionalFiles"`\>

## Properties

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

### originalPath

> **originalPath**: `string`

Defined in: [core/src/output-plan.ts:49](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/output-plan.ts#L49)

Original formatter path before normalization.

***

### owner

> **owner**: `string`

Defined in: [core/src/output-plan.ts:51](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/output-plan.ts#L51)

Formatter or adapter that owns the file.

***

### path

> **path**: `string`

Defined in: [core/src/output-plan.ts:47](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/output-plan.ts#L47)

Normalized project-relative path.

#### Overrides

[`OutputArtifact`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md).[`path`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputArtifact/index.md#path)

***

### resourceOf?

> `optional` **resourceOf?**: `string`

Defined in: [core/src/output-plan.ts:55](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/output-plan.ts#L55)

Normalized parent path for nested resources.

***

### role

> **role**: [`OutputPlanArtifactRole`](https://getpromptscript.dev/api-reference/core/src/type-aliases/OutputPlanArtifactRole/index.md)

Defined in: [core/src/output-plan.ts:53](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/output-plan.ts#L53)

Artifact role used for collision resolution.