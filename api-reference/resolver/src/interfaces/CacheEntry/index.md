# CacheEntry

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CacheEntry

Defined in: [resolver/src/git-cache-manager.ts:39](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/resolver/src/git-cache-manager.ts#L39)

Cache entry with metadata and path information.

## Properties

### isStale

> **isStale**: `boolean`

Defined in: [resolver/src/git-cache-manager.ts:45](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/resolver/src/git-cache-manager.ts#L45)

Whether the cache is stale (beyond TTL)

***

### metadata

> **metadata**: [`CacheMetadata`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/CacheMetadata/index.md)

Defined in: [resolver/src/git-cache-manager.ts:43](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/resolver/src/git-cache-manager.ts#L43)

Cache metadata

***

### path

> **path**: `string`

Defined in: [resolver/src/git-cache-manager.ts:41](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/resolver/src/git-cache-manager.ts#L41)

Path to the cached repository