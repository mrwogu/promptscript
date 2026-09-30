# walkText()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: walkText()

> **walkText**(`ast`, `callback`, `options?`): `void`

Defined in: [validator/src/walker.ts:44](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/walker.ts#L44)

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