# applyOverride()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: applyOverride()

> **applyOverride**(`ast`, `override`, `options?`): [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Defined in: [core/src/block-override.ts:531](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/block-override.ts#L531)

Atomically replace one existing block or nested value.

## Parameters

### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

### override

[`OverrideBlock`](https://getpromptscript.dev/api-reference/core/src/interfaces/OverrideBlock/index.md)

### options?

[`ApplyOverrideOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/ApplyOverrideOptions/index.md) = `{}`

## Returns

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)