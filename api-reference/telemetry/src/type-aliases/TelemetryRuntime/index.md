# TelemetryRuntime

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: TelemetryRuntime

> **TelemetryRuntime** = `"node"` \| `"deno"`

Defined in: [telemetry/src/types.ts:8](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/telemetry/src/types.ts#L8)

Runtime hosting the CLI. Node and Deno records must not mix: batches and
spool keys are separated by this value.