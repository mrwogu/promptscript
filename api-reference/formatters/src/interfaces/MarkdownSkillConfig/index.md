# MarkdownSkillConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: MarkdownSkillConfig

Defined in: [formatters/src/markdown-instruction-formatter.ts:38](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/formatters/src/markdown-instruction-formatter.ts#L38)

Configuration for a markdown-based skill file.

## Properties

### argumentHint?

> `optional` **argumentHint?**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:44](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/formatters/src/markdown-instruction-formatter.ts#L44)

Optional argument hint

***

### content

> **content**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:46](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/formatters/src/markdown-instruction-formatter.ts#L46)

Skill content/instructions

***

### description

> **description**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:42](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/formatters/src/markdown-instruction-formatter.ts#L42)

Description

***

### examples?

> `optional` **examples?**: `object`[]

Defined in: [formatters/src/markdown-instruction-formatter.ts:59](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/formatters/src/markdown-instruction-formatter.ts#L59)

Pre-extracted examples from the skill's nested examples property

#### description?

> `optional` **description?**: `string`

#### input

> **input**: `string`

#### name

> **name**: `string`

#### output

> **output**: `string`

***

### license?

> `optional` **license?**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:57](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/formatters/src/markdown-instruction-formatter.ts#L57)

License identifier from SKILL.md frontmatter

***

### name

> **name**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:40](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/formatters/src/markdown-instruction-formatter.ts#L40)

Skill name

***

### outputDir?

> `optional` **outputDir?**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:64](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/formatters/src/markdown-instruction-formatter.ts#L64)

Relative output directory underneath the target's skill folder.
Overrides the default `<dotDir>/skills/<name>` layout when provided.

***

### rawFrontmatter?

> `optional` **rawFrontmatter?**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:55](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/formatters/src/markdown-instruction-formatter.ts#L55)

Raw frontmatter from source SKILL.md for pass-through

***

### resources?

> `optional` **resources?**: `object`[]

Defined in: [formatters/src/markdown-instruction-formatter.ts:48](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/formatters/src/markdown-instruction-formatter.ts#L48)

Resource files to copy alongside the skill file

#### content

> **content**: `string`

#### executable?

> `optional` **executable?**: `boolean`

#### origin?

> `optional` **origin?**: `string`

#### relativePath

> **relativePath**: `string`