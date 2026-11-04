# WatchCallback

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: WatchCallback

> **WatchCallback** = (`result`, `changedFiles`) => `void`

Defined in: [compiler/src/types.ts:281](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L281)

Callback invoked when watch mode detects changes and recompiles.

## Parameters

### result

[`CompileResult`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CompileResult/index.md)

### changedFiles

`string`[]

## Returns

`void`