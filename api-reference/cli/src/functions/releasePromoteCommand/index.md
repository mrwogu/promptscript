# releasePromoteCommand()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: releasePromoteCommand()

> **releasePromoteCommand**(`reference`, `options`): `Promise`\<`void`\>

Defined in: [cli/src/commands/release/promote.ts:276](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/commands/release/promote.ts#L276)

Point the label of an environment at a bundle. The first environment recompiles the
source with policies and accepts only the hash it produces; every later one takes the
previous environment's hash. The bundle file must exist and verify.

## Parameters

### reference

`string`

### options

`ReleasePromoteOptions`

## Returns

`Promise`\<`void`\>