# formatPath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: formatPath()

> **formatPath**(`ref`): `string`

Defined in: [core/src/utils/path.ts:159](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/utils/path.ts#L159)

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