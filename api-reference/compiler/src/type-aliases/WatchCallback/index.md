# WatchCallback

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: WatchCallback

> **WatchCallback** = (`result`, `changedFiles`) => `void`

Defined in: [compiler/src/types.ts:281](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/compiler/src/types.ts#L281)

Callback invoked when watch mode detects changes and recompiles.

## Parameters

### result

[`CompileResult`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CompileResult/index.md)

### changedFiles

`string`[]

## Returns

`void`