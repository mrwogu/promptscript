# WatchCallback

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: WatchCallback

> **WatchCallback** = (`result`, `changedFiles`) => `void`

Defined in: [compiler/src/types.ts:247](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/compiler/src/types.ts#L247)

Callback invoked when watch mode detects changes and recompiles.

## Parameters

### result

[`CompileResult`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CompileResult/index.md)

### changedFiles

`string`[]

## Returns

`void`