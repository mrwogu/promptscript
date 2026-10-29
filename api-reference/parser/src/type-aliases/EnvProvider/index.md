# EnvProvider

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: EnvProvider

> **EnvProvider** = (`name`) => `string` \| `undefined`

Defined in: [parser/src/grammar/visitor.ts:265](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/parser/src/grammar/visitor.ts#L265)

Function type for providing environment variable values.
Returns the value for the given variable name, or undefined if not set.

## Parameters

### name

`string`

## Returns

`string` \| `undefined`