# Telemetry API

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# telemetry/src

## Classes

- [TelemetrySession](https://getpromptscript.dev/api-reference/telemetry/src/classes/TelemetrySession/index.md)

## Interfaces

- [DetachedChild](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/DetachedChild/index.md)
- [FlushResult](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/FlushResult/index.md)
- [FlushSelfInvocation](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/FlushSelfInvocation/index.md)
- [FlushState](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/FlushState/index.md)
- [ResolvedTelemetryConfig](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/ResolvedTelemetryConfig/index.md)
- [RuntimeMetadata](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/RuntimeMetadata/index.md)
- [SpoolInfo](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/SpoolInfo/index.md)
- [SpoolRecord](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/SpoolRecord/index.md)
- [TelemetryBatch](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/TelemetryBatch/index.md)
- [TelemetryConfigInput](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/TelemetryConfigInput/index.md)
- [TelemetryPayload](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/TelemetryPayload/index.md)
- [TelemetrySessionOptions](https://getpromptscript.dev/api-reference/telemetry/src/interfaces/TelemetrySessionOptions/index.md)

## Type Aliases

- [SendResult](https://getpromptscript.dev/api-reference/telemetry/src/type-aliases/SendResult/index.md)
- [SpawnDetached](https://getpromptscript.dev/api-reference/telemetry/src/type-aliases/SpawnDetached/index.md)
- [TelemetryEvent](https://getpromptscript.dev/api-reference/telemetry/src/type-aliases/TelemetryEvent/index.md)
- [TelemetryFetch](https://getpromptscript.dev/api-reference/telemetry/src/type-aliases/TelemetryFetch/index.md)
- [TelemetryOutcome](https://getpromptscript.dev/api-reference/telemetry/src/type-aliases/TelemetryOutcome/index.md)
- [TelemetryRuntime](https://getpromptscript.dev/api-reference/telemetry/src/type-aliases/TelemetryRuntime/index.md)

## Variables

- [DEFAULT\_TELEMETRY\_ENDPOINT](https://getpromptscript.dev/api-reference/telemetry/src/variables/DEFAULT_TELEMETRY_ENDPOINT/index.md)
- [TELEMETRY\_EVENT\_SCHEMA](https://getpromptscript.dev/api-reference/telemetry/src/variables/TELEMETRY_EVENT_SCHEMA/index.md)

## Functions

- [appendSpoolRecords](https://getpromptscript.dev/api-reference/telemetry/src/functions/appendSpoolRecords/index.md)
- [buildTelemetryBatches](https://getpromptscript.dev/api-reference/telemetry/src/functions/buildTelemetryBatches/index.md)
- [getSpoolInfo](https://getpromptscript.dev/api-reference/telemetry/src/functions/getSpoolInfo/index.md)
- [isExcludedCommand](https://getpromptscript.dev/api-reference/telemetry/src/functions/isExcludedCommand/index.md)
- [isTelemetryOutcome](https://getpromptscript.dev/api-reference/telemetry/src/functions/isTelemetryOutcome/index.md)
- [maybeSpawnFlush](https://getpromptscript.dev/api-reference/telemetry/src/functions/maybeSpawnFlush/index.md)
- [postTelemetry](https://getpromptscript.dev/api-reference/telemetry/src/functions/postTelemetry/index.md)
- [readFlushState](https://getpromptscript.dev/api-reference/telemetry/src/functions/readFlushState/index.md)
- [resolveTelemetryConfig](https://getpromptscript.dev/api-reference/telemetry/src/functions/resolveTelemetryConfig/index.md)
- [runFlush](https://getpromptscript.dev/api-reference/telemetry/src/functions/runFlush/index.md)
- [runtimeMetadata](https://getpromptscript.dev/api-reference/telemetry/src/functions/runtimeMetadata/index.md)
- [sanitizeCommand](https://getpromptscript.dev/api-reference/telemetry/src/functions/sanitizeCommand/index.md)
- [sanitizeFeature](https://getpromptscript.dev/api-reference/telemetry/src/functions/sanitizeFeature/index.md)
- [writeFlushState](https://getpromptscript.dev/api-reference/telemetry/src/functions/writeFlushState/index.md)