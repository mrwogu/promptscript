# FeatureSpec

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: FeatureSpec

Defined in: [formatters/src/feature-matrix.ts:35](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/feature-matrix.ts#L35)

Feature specification.

## Properties

### category

> **category**: [`FeatureCategory`](https://getpromptscript.dev/api-reference/formatters/src/type-aliases/FeatureCategory/index.md)

Defined in: [formatters/src/feature-matrix.ts:43](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/feature-matrix.ts#L43)

Category for grouping

***

### description

> **description**: `string`

Defined in: [formatters/src/feature-matrix.ts:41](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/feature-matrix.ts#L41)

Description of the feature

***

### docsUrl?

> `optional` **docsUrl?**: `Partial`\<`Record`\<[`KnownTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/KnownTarget/index.md), `string`\>\>

Defined in: [formatters/src/feature-matrix.ts:49](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/feature-matrix.ts#L49)

Link to tool documentation

***

### id

> **id**: `string`

Defined in: [formatters/src/feature-matrix.ts:37](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/feature-matrix.ts#L37)

Unique feature identifier

***

### name

> **name**: `string`

Defined in: [formatters/src/feature-matrix.ts:39](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/feature-matrix.ts#L39)

Human-readable name

***

### testStrategy?

> `optional` **testStrategy?**: `string`

Defined in: [formatters/src/feature-matrix.ts:47](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/feature-matrix.ts#L47)

How to test this feature

***

### tools

> **tools**: `Partial`\<`Record`\<[`ToolName`](https://getpromptscript.dev/api-reference/formatters/src/type-aliases/ToolName/index.md), [`FeatureStatus`](https://getpromptscript.dev/api-reference/formatters/src/type-aliases/FeatureStatus/index.md)\>\>

Defined in: [formatters/src/feature-matrix.ts:45](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/feature-matrix.ts#L45)

Support status for each target; canonical projections include all targets