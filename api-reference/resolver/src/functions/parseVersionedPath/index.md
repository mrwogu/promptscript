# parseVersionedPath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parseVersionedPath()

> **parseVersionedPath**(`path`): [`ParsedVersionedPath`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ParsedVersionedPath/index.md)

Defined in: [resolver/src/git-url-utils.ts:280](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/git-url-utils.ts#L280)

Parse a versioned path to extract path and version.

## Parameters

### path

`string`

Path that may contain version (e.g., @company/base@v1.0.0)

## Returns

[`ParsedVersionedPath`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ParsedVersionedPath/index.md)

Parsed path and version

## Example

```typescript
parseVersionedPath('@company/base@v1.0.0');
// { path: '@company/base', version: 'v1.0.0' }

parseVersionedPath('@company/base');
// { path: '@company/base', version: undefined }
```