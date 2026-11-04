# EnvProvider

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: EnvProvider

> **EnvProvider** = (`name`) => `string` \| `undefined`

Defined in: [parser/src/grammar/visitor.ts:265](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/parser/src/grammar/visitor.ts#L265)

Function type for providing environment variable values.
Returns the value for the given variable name, or undefined if not set.

## Parameters

### name

`string`

## Returns

`string` \| `undefined`