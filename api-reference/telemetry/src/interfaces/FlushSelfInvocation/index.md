# FlushSelfInvocation

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: FlushSelfInvocation

Defined in: [telemetry/src/reporter.ts:45](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/telemetry/src/reporter.ts#L45)

How the CLI re-executes itself to flush telemetry in the background.
Node spawns the CLI entrypoint; deno compile binaries re-execute
themselves; deno run re-runs the npm package with scoped permissions.

## Properties

### executable

> **executable**: `string`

Defined in: [telemetry/src/reporter.ts:46](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/telemetry/src/reporter.ts#L46)

***

### prefixArgs

> **prefixArgs**: `string`[]

Defined in: [telemetry/src/reporter.ts:47](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/telemetry/src/reporter.ts#L47)