# createFileSystemRegistry()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createFileSystemRegistry()

> **createFileSystemRegistry**(`rootPath`): [`FileSystemRegistry`](https://getpromptscript.dev/api-reference/resolver/src/classes/FileSystemRegistry/index.md)

Defined in: [resolver/src/registry.ts:415](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/resolver/src/registry.ts#L415)

Create a filesystem-based registry.

## Parameters

### rootPath

`string`

Root directory for the registry

## Returns

[`FileSystemRegistry`](https://getpromptscript.dev/api-reference/resolver/src/classes/FileSystemRegistry/index.md)

FileSystemRegistry instance

## Example

```typescript
const registry = createFileSystemRegistry('/path/to/registry');
const content = await registry.fetch('@core/guards/compliance.prs');
```