# releasePromoteCommand()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: releasePromoteCommand()

> **releasePromoteCommand**(`reference`, `options`): `Promise`\<`void`\>

Defined in: [cli/src/commands/release/promote.ts:276](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/cli/src/commands/release/promote.ts#L276)

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