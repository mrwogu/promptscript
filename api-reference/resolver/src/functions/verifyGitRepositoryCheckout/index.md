# verifyGitRepositoryCheckout()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: verifyGitRepositoryCheckout()

> **verifyGitRepositoryCheckout**(`directory`, `gitDirectoryName`, `expectedCommit`, `allowedUntrackedFiles?`, `options?`): `Promise`\<`void`\>

Defined in: [resolver/src/vendor-manifest.ts:243](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/vendor-manifest.ts#L243)

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