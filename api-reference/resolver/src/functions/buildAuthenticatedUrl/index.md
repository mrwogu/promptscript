# buildAuthenticatedUrl()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: buildAuthenticatedUrl()

> **buildAuthenticatedUrl**(`url`, `token`): `string`

Defined in: [resolver/src/git-url-utils.ts:216](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/resolver/src/git-url-utils.ts#L216)

Build an authenticated Git URL with a token.

## Parameters

### url

`string`

Original Git URL

### token

`string`

Authentication token (PAT)

## Returns

`string`

URL with embedded token for HTTPS auth

## Example

```typescript
buildAuthenticatedUrl('https://github.com/org/repo.git', 'ghp_xxxx');
// 'https://ghp_xxxx@github.com/org/repo.git'
```