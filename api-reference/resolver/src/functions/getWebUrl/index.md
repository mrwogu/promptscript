# getWebUrl()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getWebUrl()

> **getWebUrl**(`url`): `string`

Defined in: [resolver/src/git-url-utils.ts:316](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-url-utils.ts#L316)

Get the web URL for a Git repository.

## Parameters

### url

`string`

Git URL

## Returns

`string`

Web URL for browsing the repository

## Example

```typescript
getWebUrl('git@github.com:org/repo.git');
// 'https://github.com/org/repo'
```