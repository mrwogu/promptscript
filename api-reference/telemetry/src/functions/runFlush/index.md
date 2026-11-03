# runFlush()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: runFlush()

> **runFlush**(`config`, `fetchImplementation?`): `Promise`\<[`FlushResult`](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/FlushResult/index.md)\>

Defined in: [telemetry/src/flush.ts:49](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/telemetry/src/flush.ts#L49)

## Parameters

### config

[`ResolvedTelemetryConfig`](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/ResolvedTelemetryConfig/index.md)

### fetchImplementation?

[`TelemetryFetch`](https://getpromptscript.dev/api-reference/telemetry/src/type-aliases/TelemetryFetch/index.md) = `fetch`

## Returns

`Promise`\<[`FlushResult`](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/FlushResult/index.md)\>