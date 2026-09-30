# parsePath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parsePath()

> **parsePath**(`path`): `string`[]

Defined in: [formatters/src/structured-output.ts:32](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/structured-output.ts#L32)

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