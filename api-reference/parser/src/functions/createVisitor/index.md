# createVisitor()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createVisitor()

> **createVisitor**(): `PromptScriptVisitor`

Defined in: [parser/src/grammar/visitor.ts:1426](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/parser/src/grammar/visitor.ts#L1426)

Create an isolated visitor instance for one parse request.

The visitor stores interpolation settings, environment providers,
diagnostics, and transformation caches on the instance.

## Returns

`PromptScriptVisitor`