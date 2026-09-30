# MarkdownSkillConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: MarkdownSkillConfig

Defined in: [formatters/src/markdown-instruction-formatter.ts:37](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/markdown-instruction-formatter.ts#L37)

Configuration for a markdown-based skill file.

## Properties

### argumentHint?

> `optional` **argumentHint?**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:43](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/markdown-instruction-formatter.ts#L43)

Optional argument hint

***

### content

> **content**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:45](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/markdown-instruction-formatter.ts#L45)

Skill content/instructions

***

### description

> **description**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:41](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/markdown-instruction-formatter.ts#L41)

Description

***

### examples?

> `optional` **examples?**: `object`[]

Defined in: [formatters/src/markdown-instruction-formatter.ts:58](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/markdown-instruction-formatter.ts#L58)

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

Defined in: [formatters/src/markdown-instruction-formatter.ts:56](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/markdown-instruction-formatter.ts#L56)

License identifier from SKILL.md frontmatter

***

### name

> **name**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:39](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/markdown-instruction-formatter.ts#L39)

Skill name

***

### outputDir?

> `optional` **outputDir?**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:63](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/markdown-instruction-formatter.ts#L63)

Relative output directory underneath the target's skill folder.
Overrides the default `<dotDir>/skills/<name>` layout when provided.

***

### rawFrontmatter?

> `optional` **rawFrontmatter?**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:54](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/markdown-instruction-formatter.ts#L54)

Raw frontmatter from source SKILL.md for pass-through

***

### resources?

> `optional` **resources?**: `object`[]

Defined in: [formatters/src/markdown-instruction-formatter.ts:47](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/markdown-instruction-formatter.ts#L47)

Resource files to copy alongside the skill file

#### content

> **content**: `string`

#### executable?

> `optional` **executable?**: `boolean`

#### origin?

> `optional` **origin?**: `string`

#### relativePath

> **relativePath**: `string`