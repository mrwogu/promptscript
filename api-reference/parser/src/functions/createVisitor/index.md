# createVisitor()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createVisitor()

> **createVisitor**(): `PromptScriptVisitor`

Defined in: [parser/src/grammar/visitor.ts:1427](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/parser/src/grammar/visitor.ts#L1427)

Create an isolated visitor instance for one parse request.

The visitor stores interpolation settings, environment providers,
diagnostics, and transformation caches on the instance.

## Returns

`PromptScriptVisitor`