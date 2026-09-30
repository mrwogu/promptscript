# formatPath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: formatPath()

> **formatPath**(`ref`): `string`

Defined in: [core/src/utils/path.ts:159](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/utils/path.ts#L159)

Format a PathReference back to its string representation.

## Parameters

### ref

[`PathReference`](https://getpromptscript.dev/api-reference/core/src/interfaces/PathReference/index.md) \| `ParsedPath`

PathReference to format

## Returns

`string`

Formatted path string

## Example

```typescript
formatPath({ namespace: 'core', segments: ['guards', 'compliance'], version: '1.0.0', isRelative: false })
// '@core/guards/compliance@1.0.0'

formatPath({ segments: ['local', 'file'], isRelative: true })
// './local/file'
```