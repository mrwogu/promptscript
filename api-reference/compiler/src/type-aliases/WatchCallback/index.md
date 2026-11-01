# WatchCallback

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: WatchCallback

> **WatchCallback** = (`result`, `changedFiles`) => `void`

Defined in: [compiler/src/types.ts:261](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/compiler/src/types.ts#L261)

Callback invoked when watch mode detects changes and recompiles.

## Parameters

### result

[`CompileResult`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CompileResult/index.md)

### changedFiles

`string`[]

## Returns

`void`