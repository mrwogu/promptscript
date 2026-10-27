# parsePath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parsePath()

> **parsePath**(`path`): `string`[]

Defined in: [formatters/src/structured-output.ts:32](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/structured-output.ts#L32)

Parse a dotted path into segments.

## Parameters

### path

`string`

## Returns

`string`[]

## Example

```ts
'hooks.PreToolUse' -> ['hooks', 'PreToolUse']
```