# parseGitUrl()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parseGitUrl()

> **parseGitUrl**(`url`): [`ParsedGitUrl`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ParsedGitUrl/index.md) \| `null`

Defined in: [resolver/src/git-url-utils.ts:121](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/resolver/src/git-url-utils.ts#L121)

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