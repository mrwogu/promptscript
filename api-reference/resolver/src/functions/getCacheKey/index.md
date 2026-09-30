# getCacheKey()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getCacheKey()

> **getCacheKey**(`url`, `ref?`): `string`

Defined in: [resolver/src/git-url-utils.ts:245](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-url-utils.ts#L245)

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