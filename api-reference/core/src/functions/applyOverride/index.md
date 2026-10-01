# applyOverride()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: applyOverride()

> **applyOverride**(`ast`, `override`, `options?`): [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Defined in: [core/src/block-override.ts:531](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/block-override.ts#L531)

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