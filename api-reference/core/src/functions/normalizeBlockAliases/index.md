# normalizeBlockAliases()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: normalizeBlockAliases()

> **normalizeBlockAliases**(`ast`, `options?`): [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Defined in: [core/src/block-aliases.ts:50](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/block-aliases.ts#L50)

Normalize aliases and merge alias/canonical collisions in source order.

Repeated canonical blocks remain distinct for compatibility. A collision is
merged only when at least one declaration used an alias.

## Parameters

### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

### options?

[`NormalizeBlockAliasOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/NormalizeBlockAliasOptions/index.md) = `{}`

## Returns

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)