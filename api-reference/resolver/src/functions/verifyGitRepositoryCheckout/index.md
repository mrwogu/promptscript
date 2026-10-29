# verifyGitRepositoryCheckout()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: verifyGitRepositoryCheckout()

> **verifyGitRepositoryCheckout**(`directory`, `gitDirectoryName`, `expectedCommit`, `allowedUntrackedFiles?`, `options?`): `Promise`\<`void`\>

Defined in: [resolver/src/vendor-manifest.ts:243](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/resolver/src/vendor-manifest.ts#L243)

## Parameters

### directory

`string`

### gitDirectoryName

`string`

### expectedCommit

`string`

### allowedUntrackedFiles?

`ReadonlySet`\<`string`\> = `...`

### options?

#### allowPartial?

`boolean`

## Returns

`Promise`\<`void`\>