# RemoteValidation

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: RemoteValidation

Defined in: [resolver/src/git-registry.ts:1271](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/resolver/src/git-registry.ts#L1271)

Result of validating remote repository accessibility.

## Properties

### accessible

> **accessible**: `boolean`

Defined in: [resolver/src/git-registry.ts:1273](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/resolver/src/git-registry.ts#L1273)

Whether the remote repository is accessible

***

### error?

> `optional` **error?**: `string`

Defined in: [resolver/src/git-registry.ts:1277](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/resolver/src/git-registry.ts#L1277)

Error message describing why the repository is not accessible

***

### headCommit?

> `optional` **headCommit?**: `string`

Defined in: [resolver/src/git-registry.ts:1275](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/resolver/src/git-registry.ts#L1275)

HEAD or default branch commit hash (only present when accessible)