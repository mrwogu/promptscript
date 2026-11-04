# toLegacyProgram()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: toLegacyProgram()

> **toLegacyProgram**(`program`, `options?`): [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Defined in: [core/src/canonical-ast.ts:1589](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/canonical-ast.ts#L1589)

Project a canonical program to the legacy `Program` shape.

Compatibility projection. It may be removed in a later major version.

## Parameters

### program

[`CanonicalProgram`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalProgram/index.md)

### options?

[`LegacyProjectionOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/LegacyProjectionOptions/index.md) = `{}`

## Returns

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)