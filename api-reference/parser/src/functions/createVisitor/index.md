# createVisitor()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createVisitor()

> **createVisitor**(): `PromptScriptVisitor`

Defined in: [parser/src/grammar/visitor.ts:1392](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/parser/src/grammar/visitor.ts#L1392)

Create an isolated visitor instance for one parse request.

The visitor stores interpolation settings, environment providers,
diagnostics, and transformation caches on the instance.

## Returns

`PromptScriptVisitor`