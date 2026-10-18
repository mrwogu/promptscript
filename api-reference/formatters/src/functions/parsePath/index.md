# parsePath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parsePath()

> **parsePath**(`path`): `string`[]

Defined in: [formatters/src/structured-output.ts:32](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/formatters/src/structured-output.ts#L32)

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