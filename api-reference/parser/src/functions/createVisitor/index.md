# createVisitor()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createVisitor()

> **createVisitor**(): `PromptScriptVisitor`

Defined in: [parser/src/grammar/visitor.ts:1426](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/parser/src/grammar/visitor.ts#L1426)

Create an isolated visitor instance for one parse request.

The visitor stores interpolation settings, environment providers,
diagnostics, and transformation caches on the instance.

## Returns

`PromptScriptVisitor`