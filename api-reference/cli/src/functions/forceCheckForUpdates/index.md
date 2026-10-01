# forceCheckForUpdates()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: forceCheckForUpdates()

> **forceCheckForUpdates**(`currentVersion`): `Promise`\<\{ `error`: `boolean`; `info`: [`UpdateInfo`](https://getpromptscript.dev/api-reference/cli/src/interfaces/UpdateInfo/index.md) \| `null`; \}\>

Defined in: [cli/src/utils/version-check.ts:270](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/utils/version-check.ts#L270)

Force check for updates (ignores cache).
Used by the update-check command.

## Parameters

### currentVersion

`string`

The current CLI version

## Returns

`Promise`\<\{ `error`: `boolean`; `info`: [`UpdateInfo`](https://getpromptscript.dev/api-reference/cli/src/interfaces/UpdateInfo/index.md) \| `null`; \}\>

Update info with check result