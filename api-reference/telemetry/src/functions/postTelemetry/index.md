# postTelemetry()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: postTelemetry()

> **postTelemetry**(`endpoint`, `payload`, `timeoutMs`, `fetchImplementation?`): `Promise`\<[`SendResult`](https://getpromptscript.dev/api-reference/telemetry/src/type-aliases/SendResult/index.md)\>

Defined in: [telemetry/src/transport.ts:17](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/telemetry/src/transport.ts#L17)

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