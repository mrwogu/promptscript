# SpawnDetached

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: SpawnDetached

> **SpawnDetached** = (`command`, `args`, `options`) => [`DetachedChild`](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/DetachedChild/index.md)

Defined in: [telemetry/src/reporter.ts:30](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/telemetry/src/reporter.ts#L30)

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