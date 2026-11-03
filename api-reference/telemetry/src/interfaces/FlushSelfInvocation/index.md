# FlushSelfInvocation

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: FlushSelfInvocation

Defined in: [telemetry/src/reporter.ts:45](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/telemetry/src/reporter.ts#L45)

How the CLI re-executes itself to flush telemetry in the background.
Node spawns the CLI entrypoint; deno compile binaries re-execute
themselves; deno run re-runs the npm package with scoped permissions.

## Properties

### executable

> **executable**: `string`

Defined in: [telemetry/src/reporter.ts:46](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/telemetry/src/reporter.ts#L46)

***

### prefixArgs

> **prefixArgs**: `string`[]

Defined in: [telemetry/src/reporter.ts:47](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/telemetry/src/reporter.ts#L47)