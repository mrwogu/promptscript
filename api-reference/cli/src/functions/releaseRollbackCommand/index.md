# releaseRollbackCommand()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: releaseRollbackCommand()

> **releaseRollbackCommand**(`environment`, `options`): `Promise`\<`void`\>

Defined in: [cli/src/commands/release/rollback.ts:176](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/cli/src/commands/release/rollback.ts#L176)

Undo the last committed change of an environment's label. The label comes back whole,
version 1 or 2. Every hash of a restored entry, experiment arms included, must exist and
verify, and every hash of an entry that changes goes through the gates, the arms with
traffic too. The order of the environments is not checked, as before. A committed rollback
is undone by a second one.

## Parameters

### environment

`string`

### options

`ReleaseCommandOptions`

## Returns

`Promise`\<`void`\>