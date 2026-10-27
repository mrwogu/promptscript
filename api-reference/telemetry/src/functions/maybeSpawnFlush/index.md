# maybeSpawnFlush()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: maybeSpawnFlush()

> **maybeSpawnFlush**(`config`, `options?`): `boolean`

Defined in: [telemetry/src/reporter.ts:116](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/telemetry/src/reporter.ts#L116)

## Parameters

### config

[`ResolvedTelemetryConfig`](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/ResolvedTelemetryConfig/index.md)

### options?

#### entrypoint?

`string`

#### environment?

`ProcessEnv`

#### executable?

`string`

#### now?

`number`

#### selfInvocation?

[`FlushSelfInvocation`](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/FlushSelfInvocation/index.md)

#### spawn?

[`SpawnDetached`](https://getpromptscript.dev/api-reference/telemetry/src/type-aliases/SpawnDetached/index.md)

## Returns

`boolean`