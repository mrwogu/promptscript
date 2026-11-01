# createFileWatcher()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createFileWatcher()

> **createFileWatcher**(`workspace`, `watchPaths`, `onEvent`): `FSWatcher`

Defined in: [server/src/watcher.ts:17](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/server/src/watcher.ts#L17)

## Parameters

### workspace

`string`

### watchPaths

`string`[]

### onEvent

(`event`) => `void`

## Returns

`FSWatcher`