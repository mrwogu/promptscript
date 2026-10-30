# createVisitor()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createVisitor()

> **createVisitor**(): `PromptScriptVisitor`

Defined in: [parser/src/grammar/visitor.ts:1426](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/parser/src/grammar/visitor.ts#L1426)

Create an isolated visitor instance for one parse request.

The visitor stores interpolation settings, environment providers,
diagnostics, and transformation caches on the instance.

## Returns

`PromptScriptVisitor`