# TelemetrySessionOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: TelemetrySessionOptions

Defined in: [telemetry/src/reporter.ts:16](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/telemetry/src/reporter.ts#L16)

## Properties

### command

> **command**: `string`

Defined in: [telemetry/src/reporter.ts:21](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/telemetry/src/reporter.ts#L21)

***

### config

> **config**: [`ResolvedTelemetryConfig`](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/ResolvedTelemetryConfig/index.md)

Defined in: [telemetry/src/reporter.ts:17](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/telemetry/src/reporter.ts#L17)

***

### features?

> `optional` **features?**: `string`[]

Defined in: [telemetry/src/reporter.ts:22](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/telemetry/src/reporter.ts#L22)

***

### metadata

> **metadata**: [`RuntimeMetadata`](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/RuntimeMetadata/index.md)

Defined in: [telemetry/src/reporter.ts:18](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/telemetry/src/reporter.ts#L18)

***

### runtime

> **runtime**: [`TelemetryRuntime`](https://getpromptscript.dev/api-reference/telemetry/src/type-aliases/TelemetryRuntime/index.md)

Defined in: [telemetry/src/reporter.ts:20](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/telemetry/src/reporter.ts#L20)

Runtime hosting the CLI, passed in by the CLI (telemetry is a leaf).

***

### startTime?

> `optional` **startTime?**: `number`

Defined in: [telemetry/src/reporter.ts:23](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/telemetry/src/reporter.ts#L23)