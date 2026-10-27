# CanonicalParseResult

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CanonicalParseResult

Defined in: [parser/src/parse.ts:55](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/parser/src/parse.ts#L55)

Result of parsing PromptScript into the immutable canonical AST.

## Properties

### ast

> **ast**: [`CanonicalProgram`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalProgram/index.md) \| `null`

Defined in: [parser/src/parse.ts:57](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/parser/src/parse.ts#L57)

The canonical AST, or null if parsing failed with tolerant=false.

***

### comments

> **comments**: readonly [`Comment`](https://getpromptscript.dev/api-reference/parser/src/interfaces/Comment/index.md)[]

Defined in: [parser/src/parse.ts:61](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/parser/src/parse.ts#L61)

Comments in source order. They are not part of the AST.

***

### errors

> **errors**: [`ParseError`](https://getpromptscript.dev/api-reference/core/src/classes/ParseError/index.md)[]

Defined in: [parser/src/parse.ts:59](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/parser/src/parse.ts#L59)

List of errors encountered during parsing.