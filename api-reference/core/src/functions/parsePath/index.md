# parsePath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parsePath()

> **parsePath**(`path`): `ParsedPath`

Defined in: [core/src/utils/path.ts:35](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/utils/path.ts#L35)

Parse a PromptScript path reference.

## Parameters

### path

`string`

Path string to parse

## Returns

`ParsedPath`

Parsed path components

## Throws

If path format is invalid

## Example

```typescript
parsePath('@core/guards/compliance@1.0.0')
// { namespace: 'core', segments: ['guards', 'compliance'], version: '1.0.0', isRelative: false }

parsePath('./local/file')
// { namespace: undefined, segments: ['local', 'file'], version: undefined, isRelative: true }
```