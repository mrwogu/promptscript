# WatchCallback

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: WatchCallback

> **WatchCallback** = (`result`, `changedFiles`) => `void`

Defined in: [compiler/src/types.ts:281](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/compiler/src/types.ts#L281)

Callback invoked when watch mode detects changes and recompiles.

## Parameters

### result

[`CompileResult`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CompileResult/index.md)

### changedFiles

`string`[]

## Returns

`void`