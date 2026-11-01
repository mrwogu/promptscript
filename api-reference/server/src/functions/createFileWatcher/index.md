# createFileWatcher()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createFileWatcher()

> **createFileWatcher**(`workspace`, `watchPaths`, `onEvent`): `FSWatcher`

Defined in: [server/src/watcher.ts:17](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/server/src/watcher.ts#L17)

## Parameters

### workspace

`string`

### watchPaths

`string`[]

### onEvent

(`event`) => `void`

## Returns

`FSWatcher`