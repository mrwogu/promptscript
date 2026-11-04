# createFileWatcher()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createFileWatcher()

> **createFileWatcher**(`workspace`, `watchPaths`, `onEvent`): `FSWatcher`

Defined in: [server/src/watcher.ts:17](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/server/src/watcher.ts#L17)

## Parameters

### workspace

`string`

### watchPaths

`string`[]

### onEvent

(`event`) => `void`

## Returns

`FSWatcher`