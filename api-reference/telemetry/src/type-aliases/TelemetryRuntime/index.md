# TelemetryRuntime

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: TelemetryRuntime

> **TelemetryRuntime** = `"node"` \| `"deno"`

Defined in: [telemetry/src/types.ts:8](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/telemetry/src/types.ts#L8)

Runtime hosting the CLI. Node and Deno records must not mix: batches and
spool keys are separated by this value.