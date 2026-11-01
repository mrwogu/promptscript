# LegacyProgram

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: LegacyProgram

> **LegacyProgram** = [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Defined in: [core/src/types/ast.ts:153](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/ast.ts#L153)

Mutable compatibility AST used by legacy integrations.

New pipeline stages should use [CanonicalProgram](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalProgram/index.md). This alias makes
the compatibility boundary explicit without renaming the long-standing
`Program` API.