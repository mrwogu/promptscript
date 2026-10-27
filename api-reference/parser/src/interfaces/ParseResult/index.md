# ParseResult

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ParseResult

Defined in: [parser/src/parse.ts:43](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/parser/src/parse.ts#L43)

Result of parsing PromptScript source code.

## Properties

### ast

> **ast**: [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md) \| `null`

Defined in: [parser/src/parse.ts:45](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/parser/src/parse.ts#L45)

The parsed AST, or null if parsing failed with tolerant=false.

***

### comments

> **comments**: readonly [`Comment`](https://getpromptscript.dev/api-reference/parser/src/interfaces/Comment/index.md)[]

Defined in: [parser/src/parse.ts:49](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/parser/src/parse.ts#L49)

Comments in source order. They are not part of the AST.

***

### errors

> **errors**: [`ParseError`](https://getpromptscript.dev/api-reference/core/src/classes/ParseError/index.md)[]

Defined in: [parser/src/parse.ts:47](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/parser/src/parse.ts#L47)

List of errors encountered during parsing.