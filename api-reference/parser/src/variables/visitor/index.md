# visitor (deprecated)

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# ~~Variable: visitor~~

> `const` **visitor**: `PromptScriptVisitor`

Defined in: [parser/src/grammar/visitor.ts:1440](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/parser/src/grammar/visitor.ts#L1440)

Legacy visitor instance kept for direct consumers of the parser API.

Parse helpers use createVisitor() so request state never leaks between calls.

## Deprecated

Shared instance: interpolation settings, environment providers, and
diagnostics accumulate on the visitor, so concurrent or reentrant use
cross-contaminates results. Call [createVisitor](https://getpromptscript.dev/api-reference/parser/src/functions/createVisitor/index.md) to obtain an instance
scoped to one parse request.