# RemoteValidation

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: RemoteValidation

Defined in: [resolver/src/git-registry.ts:1256](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L1256)

Result of validating remote repository accessibility.

## Properties

### accessible

> **accessible**: `boolean`

Defined in: [resolver/src/git-registry.ts:1258](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L1258)

Whether the remote repository is accessible

***

### error?

> `optional` **error?**: `string`

Defined in: [resolver/src/git-registry.ts:1262](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L1262)

Error message describing why the repository is not accessible

***

### headCommit?

> `optional` **headCommit?**: `string`

Defined in: [resolver/src/git-registry.ts:1260](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L1260)

HEAD or default branch commit hash (only present when accessible)