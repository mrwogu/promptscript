# SourceBlockConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: SourceBlockConfig

Defined in: [formatters/src/parity-matrix.ts:27](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/parity-matrix.ts#L27)

Source block configuration for section extraction.

## Properties

### block

> **block**: `string`

Defined in: [formatters/src/parity-matrix.ts:29](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/parity-matrix.ts#L29)

Primary block name (e.g., 'context', 'standards')

***

### property?

> `optional` **property?**: `string`

Defined in: [formatters/src/parity-matrix.ts:31](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/parity-matrix.ts#L31)

Optional nested property path (e.g., 'git', 'typescript')

***

### textPattern?

> `optional` **textPattern?**: `RegExp`

Defined in: [formatters/src/parity-matrix.ts:33](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/parity-matrix.ts#L33)

Whether this is a text extraction (vs structured)