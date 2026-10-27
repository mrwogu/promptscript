# checkForUpdates()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: checkForUpdates()

> **checkForUpdates**(`currentVersion`): `Promise`\<[`UpdateInfo`](https://getpromptscript.dev/api-reference/cli/src/interfaces/UpdateInfo/index.md) \| `null`\>

Defined in: [cli/src/utils/version-check.ts:213](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/cli/src/utils/version-check.ts#L213)

Check for updates automatically (respects cache).
Called from preAction hook.

## Parameters

### currentVersion

`string`

The current CLI version

## Returns

`Promise`\<[`UpdateInfo`](https://getpromptscript.dev/api-reference/cli/src/interfaces/UpdateInfo/index.md) \| `null`\>

Update info if a newer version is available, null otherwise