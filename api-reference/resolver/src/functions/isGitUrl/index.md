# isGitUrl()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isGitUrl()

> **isGitUrl**(`url`): `boolean`

Defined in: [resolver/src/git-url-utils.ts:84](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-url-utils.ts#L84)

Check if a URL is a Git repository URL.

## Parameters

### url

`string`

URL to check

## Returns

`boolean`

True if the URL is a Git repository URL

## Example

```typescript
isGitUrl('https://github.com/org/repo.git'); // true
isGitUrl('git@github.com:org/repo.git'); // true
isGitUrl('https://example.com/api'); // false
```