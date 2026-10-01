# verifyGitRepositoryCheckout()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: verifyGitRepositoryCheckout()

> **verifyGitRepositoryCheckout**(`directory`, `gitDirectoryName`, `expectedCommit`, `allowedUntrackedFiles?`, `options?`): `Promise`\<`void`\>

Defined in: [resolver/src/vendor-manifest.ts:243](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/vendor-manifest.ts#L243)

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