# postTelemetry()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: postTelemetry()

> **postTelemetry**(`endpoint`, `payload`, `timeoutMs`, `fetchImplementation?`): `Promise`\<[`SendResult`](https://getpromptscript.dev/api-reference/telemetry/src/type-aliases/SendResult/index.md)\>

Defined in: [telemetry/src/transport.ts:17](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/telemetry/src/transport.ts#L17)

## Parameters

### endpoint

`string`

### payload

[`TelemetryPayload`](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/TelemetryPayload/index.md)

### timeoutMs

`number`

### fetchImplementation?

[`TelemetryFetch`](https://getpromptscript.dev/api-reference/telemetry/src/type-aliases/TelemetryFetch/index.md) = `fetch`

## Returns

`Promise`\<[`SendResult`](https://getpromptscript.dev/api-reference/telemetry/src/type-aliases/SendResult/index.md)\>