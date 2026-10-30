# verifyGitRepositoryCheckout()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: verifyGitRepositoryCheckout()

> **verifyGitRepositoryCheckout**(`directory`, `gitDirectoryName`, `expectedCommit`, `allowedUntrackedFiles?`, `options?`): `Promise`\<`void`\>

Defined in: [resolver/src/vendor-manifest.ts:243](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/resolver/src/vendor-manifest.ts#L243)

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