# createFileWatcher()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createFileWatcher()

> **createFileWatcher**(`workspace`, `watchPaths`, `onEvent`): `FSWatcher`

Defined in: [server/src/watcher.ts:17](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/server/src/watcher.ts#L17)

## Parameters

### workspace

`string`

### watchPaths

`string`[]

### onEvent

(`event`) => `void`

## Returns

`FSWatcher`