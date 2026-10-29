# parsePath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parsePath()

> **parsePath**(`path`): `string`[]

Defined in: [formatters/src/structured-output.ts:32](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/structured-output.ts#L32)

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