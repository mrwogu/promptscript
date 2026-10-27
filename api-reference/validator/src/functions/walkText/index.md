# walkText()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: walkText()

> **walkText**(`ast`, `callback`, `options?`): `void`

Defined in: [validator/src/walker.ts:51](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/validator/src/walker.ts#L51)

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