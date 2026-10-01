# TelemetryPayload

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: TelemetryPayload

Defined in: [telemetry/src/types.ts:38](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/telemetry/src/types.ts#L38)

## Extends

- [`RuntimeMetadata`](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/RuntimeMetadata/index.md)

## Properties

### app

> **app**: `"promptscript"`

Defined in: [telemetry/src/types.ts:40](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/telemetry/src/types.ts#L40)

***

### app\_version

> **app\_version**: `string`

Defined in: [telemetry/src/types.ts:27](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/telemetry/src/types.ts#L27)

#### Inherited from

[`RuntimeMetadata`](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/RuntimeMetadata/index.md).[`app_version`](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/RuntimeMetadata/index.md#app_version)

***

### arch

> **arch**: `"other"` \| `"arm64"` \| `"x86_64"`

Defined in: [telemetry/src/types.ts:30](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/telemetry/src/types.ts#L30)

#### Inherited from

[`RuntimeMetadata`](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/RuntimeMetadata/index.md).[`arch`](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/RuntimeMetadata/index.md#arch)

***

### event\_schema

> **event\_schema**: `1`

Defined in: [telemetry/src/types.ts:41](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/telemetry/src/types.ts#L41)

***

### events

> **events**: [`TelemetryEvent`](https://getpromptscript.dev/api-reference/telemetry/src/type-aliases/TelemetryEvent/index.md)[]

Defined in: [telemetry/src/types.ts:43](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/telemetry/src/types.ts#L43)

***

### os

> **os**: `"windows"` \| `"darwin"` \| `"linux"` \| `"other"`

Defined in: [telemetry/src/types.ts:29](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/telemetry/src/types.ts#L29)

#### Inherited from

[`RuntimeMetadata`](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/RuntimeMetadata/index.md).[`os`](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/RuntimeMetadata/index.md#os)

***

### runtime

> **runtime**: [`TelemetryRuntime`](https://getpromptscript.dev/api-reference/telemetry/src/type-aliases/TelemetryRuntime/index.md)

Defined in: [telemetry/src/types.ts:42](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/telemetry/src/types.ts#L42)

***

### runtime\_version

> **runtime\_version**: `string`

Defined in: [telemetry/src/types.ts:28](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/telemetry/src/types.ts#L28)

#### Inherited from

[`RuntimeMetadata`](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/RuntimeMetadata/index.md).[`runtime_version`](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/RuntimeMetadata/index.md#runtime_version)

***

### schema

> **schema**: `1`

Defined in: [telemetry/src/types.ts:39](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/telemetry/src/types.ts#L39)