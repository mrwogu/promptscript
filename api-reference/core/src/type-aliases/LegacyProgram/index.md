# LegacyProgram

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: LegacyProgram

> **LegacyProgram** = [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Defined in: [core/src/types/ast.ts:153](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/ast.ts#L153)

Mutable compatibility AST used by legacy integrations.

New pipeline stages should use [CanonicalProgram](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalProgram/index.md). This alias makes
the compatibility boundary explicit without renaming the long-standing
`Program` API.