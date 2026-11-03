# toLegacyBlock()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: toLegacyBlock()

> **toLegacyBlock**(`block`, `options?`): [`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md)

Defined in: [core/src/canonical-ast.ts:1571](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/canonical-ast.ts#L1571)

Project a canonical block to the legacy `Block` shape.

Compatibility projection. It may be removed in a later major version.

## Parameters

### block

[`CanonicalBlock`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalBlock/index.md)

### options?

[`LegacyProjectionOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/LegacyProjectionOptions/index.md) = `{}`

## Returns

[`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md)