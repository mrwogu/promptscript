# getCacheKey()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getCacheKey()

> **getCacheKey**(`url`, `ref?`): `string`

Defined in: [resolver/src/git-url-utils.ts:245](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-url-utils.ts#L245)

Generate a deterministic cache key for a Git URL.

## Parameters

### url

`string`

Git URL

### ref?

`string`

Optional Git ref (branch/tag/commit)

## Returns

`string`

Cache key string

## Example

```typescript
getCacheKey('https://github.com/org/repo.git', 'main');
// 'github.com-org-repo-main-abc123'
```