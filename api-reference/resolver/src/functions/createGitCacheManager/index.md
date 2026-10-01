# createGitCacheManager()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createGitCacheManager()

> **createGitCacheManager**(`options?`): [`GitCacheManager`](https://getpromptscript.dev/api-reference/resolver/src/classes/GitCacheManager/index.md)

Defined in: [resolver/src/git-cache-manager.ts:381](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-cache-manager.ts#L381)

Create a new GitCacheManager instance.

## Parameters

### options?

[`GitCacheManagerOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/GitCacheManagerOptions/index.md) = `{}`

Cache manager options

## Returns

[`GitCacheManager`](https://getpromptscript.dev/api-reference/resolver/src/classes/GitCacheManager/index.md)

GitCacheManager instance

## Example

```typescript
const cache = createGitCacheManager({
  cacheDir: '/custom/cache/path',
  ttl: 1800000, // 30 minutes
});

// Check if cache is valid
const isValid = await cache.isValid('https://github.com/org/repo.git', 'main');

// Get or create cache
const entry = await cache.get('https://github.com/org/repo.git', 'main');
```