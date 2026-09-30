# FormatParser

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: FormatParser

Defined in: [importer/src/parsers/types.ts:3](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/importer/src/parsers/types.ts#L3)

## Properties

### name

> **name**: `string`

Defined in: [importer/src/parsers/types.ts:4](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/importer/src/parsers/types.ts#L4)

## Methods

### canParse()

> **canParse**(`filename`, `content`): `boolean`

Defined in: [importer/src/parsers/types.ts:5](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/importer/src/parsers/types.ts#L5)

#### Parameters

##### filename

`string`

##### content

`string`

#### Returns

`boolean`

***

### parse()

> **parse**(`content`, `filename?`): [`MarkdownSection`](https://getpromptscript.dev/api-reference/importer/src/interfaces/MarkdownSection/index.md)[]

Defined in: [importer/src/parsers/types.ts:6](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/importer/src/parsers/types.ts#L6)

#### Parameters

##### content

`string`

##### filename?

`string`

#### Returns

[`MarkdownSection`](https://getpromptscript.dev/api-reference/importer/src/interfaces/MarkdownSection/index.md)[]