# GitCacheManagerOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: GitCacheManagerOptions

Defined in: [resolver/src/git-cache-manager.ts:51](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/resolver/src/git-cache-manager.ts#L51)

Options for GitCacheManager.

## Properties

### cacheDir?

> `optional` **cacheDir?**: `string`

Defined in: [resolver/src/git-cache-manager.ts:56](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/resolver/src/git-cache-manager.ts#L56)

Base directory for cache storage.
Defaults to ~/.promptscript/.cache/git

***

### ttl?

> `optional` **ttl?**: `number`

Defined in: [resolver/src/git-cache-manager.ts:63](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/resolver/src/git-cache-manager.ts#L63)

Time-to-live in milliseconds for cached entries.
After this time, the cache is considered stale.

#### Default

```ts
3600000 (1 hour)
```