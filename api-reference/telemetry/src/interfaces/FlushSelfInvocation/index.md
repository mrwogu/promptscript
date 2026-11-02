# FlushSelfInvocation

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: FlushSelfInvocation

Defined in: [telemetry/src/reporter.ts:45](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/telemetry/src/reporter.ts#L45)

How the CLI re-executes itself to flush telemetry in the background.
Node spawns the CLI entrypoint; deno compile binaries re-execute
themselves; deno run re-runs the npm package with scoped permissions.

## Properties

### executable

> **executable**: `string`

Defined in: [telemetry/src/reporter.ts:46](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/telemetry/src/reporter.ts#L46)

***

### prefixArgs

> **prefixArgs**: `string`[]

Defined in: [telemetry/src/reporter.ts:47](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/telemetry/src/reporter.ts#L47)