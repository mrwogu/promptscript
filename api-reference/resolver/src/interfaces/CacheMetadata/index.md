# CacheMetadata

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CacheMetadata

Defined in: [resolver/src/git-cache-manager.ts:21](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-cache-manager.ts#L21)

Cache metadata stored alongside cloned repositories.

## Properties

### commitHash

> **commitHash**: `string`

Defined in: [resolver/src/git-cache-manager.ts:27](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-cache-manager.ts#L27)

Current commit hash

***

### createdAt

> **createdAt**: `number`

Defined in: [resolver/src/git-cache-manager.ts:31](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-cache-manager.ts#L31)

Timestamp when the cache was created

***

### lastUpdated

> **lastUpdated**: `number`

Defined in: [resolver/src/git-cache-manager.ts:29](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-cache-manager.ts#L29)

Timestamp when the cache was last updated

***

### ref

> **ref**: `string`

Defined in: [resolver/src/git-cache-manager.ts:25](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-cache-manager.ts#L25)

Git ref (branch/tag/commit) that was checked out

***

### url

> **url**: `string`

Defined in: [resolver/src/git-cache-manager.ts:23](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-cache-manager.ts#L23)

Original Git URL

***

### version

> **version**: `1`

Defined in: [resolver/src/git-cache-manager.ts:33](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-cache-manager.ts#L33)

Version of the cache format