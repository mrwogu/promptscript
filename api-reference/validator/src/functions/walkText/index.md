# walkText()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: walkText()

> **walkText**(`ast`, `callback`, `options?`): `void`

Defined in: [validator/src/walker.ts:51](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/validator/src/walker.ts#L51)

Walk all text content in the AST.
Visits text in blocks, extend blocks, override replacements, and nested content.

## Parameters

### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

### callback

`TextCallback`

### options?

[`WalkTextOptions`](https://getpromptscript.dev/api-reference/validator/src/interfaces/WalkTextOptions/index.md)

## Returns

`void`