# normalizeGitUrl()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: normalizeGitUrl()

> **normalizeGitUrl**(`url`): `string`

Defined in: [resolver/src/git-url-utils.ts:192](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/resolver/src/git-url-utils.ts#L192)

Normalize a Git URL to a canonical HTTPS form.

## Parameters

### url

`string`

Git URL to normalize

## Returns

`string`

Normalized HTTPS URL

## Example

```typescript
normalizeGitUrl('git@github.com:org/repo.git');
// 'https://github.com/org/repo.git'
```