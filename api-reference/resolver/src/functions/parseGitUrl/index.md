# parseGitUrl()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parseGitUrl()

> **parseGitUrl**(`url`): [`ParsedGitUrl`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ParsedGitUrl/index.md) \| `null`

Defined in: [resolver/src/git-url-utils.ts:121](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/resolver/src/git-url-utils.ts#L121)

Parse a Git URL into its components.

## Parameters

### url

`string`

Git URL to parse

## Returns

[`ParsedGitUrl`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ParsedGitUrl/index.md) \| `null`

Parsed URL components or null if invalid

## Example

```typescript
const parsed = parseGitUrl('https://github.com/org/repo.git');
// { protocol: 'https', host: 'github.com', owner: 'org', repo: 'repo', original: '...' }
```