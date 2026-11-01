# verifyGitRepositoryCheckout()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: verifyGitRepositoryCheckout()

> **verifyGitRepositoryCheckout**(`directory`, `gitDirectoryName`, `expectedCommit`, `allowedUntrackedFiles?`, `options?`): `Promise`\<`void`\>

Defined in: [resolver/src/vendor-manifest.ts:243](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/resolver/src/vendor-manifest.ts#L243)

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