# SpawnDetached

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: SpawnDetached

> **SpawnDetached** = (`command`, `args`, `options`) => [`DetachedChild`](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/DetachedChild/index.md)

Defined in: [telemetry/src/reporter.ts:30](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/telemetry/src/reporter.ts#L30)

## Parameters

### command

`string`

### args

`string`[]

### options

#### detached

`true`

#### env

`NodeJS.ProcessEnv`

#### stdio

`"ignore"`

## Returns

[`DetachedChild`](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/DetachedChild/index.md)