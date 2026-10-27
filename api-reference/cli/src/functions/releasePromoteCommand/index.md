# releasePromoteCommand()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: releasePromoteCommand()

> **releasePromoteCommand**(`reference`, `options`): `Promise`\<`void`\>

Defined in: [cli/src/commands/release/promote.ts:266](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/cli/src/commands/release/promote.ts#L266)

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