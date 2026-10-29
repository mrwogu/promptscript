# releaseRollbackCommand()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: releaseRollbackCommand()

> **releaseRollbackCommand**(`environment`, `options`): `Promise`\<`void`\>

Defined in: [cli/src/commands/release/rollback.ts:110](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/commands/release/rollback.ts#L110)

Undo the last committed change of an environment's label. Every bundle the restored
label points at must exist and verify. A committed rollback is undone by a second one.

## Parameters

### environment

`string`

### options

`ReleaseCommandOptions`

## Returns

`Promise`\<`void`\>