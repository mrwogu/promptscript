# ExtractionRule

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ExtractionRule

Defined in: [formatters/src/parity-matrix.ts:61](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/parity-matrix.ts#L61)

Content extraction rule for a specific block.

## Properties

### block

> **block**: `string`

Defined in: [formatters/src/parity-matrix.ts:63](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/parity-matrix.ts#L63)

Block name to extract from

***

### contentMatcher?

> `optional` **contentMatcher?**: `RegExp`

Defined in: [formatters/src/parity-matrix.ts:69](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/parity-matrix.ts#L69)

Content validation pattern

***

### producesSections

> **producesSections**: `string`[]

Defined in: [formatters/src/parity-matrix.ts:67](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/parity-matrix.ts#L67)

Expected output sections from this extraction

***

### propertyPath?

> `optional` **propertyPath?**: `string`

Defined in: [formatters/src/parity-matrix.ts:65](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/parity-matrix.ts#L65)

Property path within block (dot notation)