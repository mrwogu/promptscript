# checkForUpdates()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: checkForUpdates()

> **checkForUpdates**(`currentVersion`): `Promise`\<[`UpdateInfo`](https://getpromptscript.dev/api-reference/cli/src/interfaces/UpdateInfo/index.md) \| `null`\>

Defined in: [cli/src/utils/version-check.ts:219](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/cli/src/utils/version-check.ts#L219)

Check for updates automatically (respects cache).
Called from preAction hook.

## Parameters

### currentVersion

`string`

The current CLI version

## Returns

`Promise`\<[`UpdateInfo`](https://getpromptscript.dev/api-reference/cli/src/interfaces/UpdateInfo/index.md) \| `null`\>

Update info if a newer version is available, null otherwise