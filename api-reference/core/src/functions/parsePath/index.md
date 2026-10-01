# parsePath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parsePath()

> **parsePath**(`path`): `ParsedPath`

Defined in: [core/src/utils/path.ts:35](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/utils/path.ts#L35)

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