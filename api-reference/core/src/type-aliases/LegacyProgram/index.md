# LegacyProgram

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: LegacyProgram

> **LegacyProgram** = [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Defined in: [core/src/types/ast.ts:155](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/ast.ts#L155)

Mutable compatibility AST used by legacy integrations.

New pipeline stages should use [CanonicalProgram](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalProgram/index.md). This alias makes
the compatibility boundary explicit without renaming the long-standing
`Program` API.

It is a compatibility projection and may be removed in a later major version.