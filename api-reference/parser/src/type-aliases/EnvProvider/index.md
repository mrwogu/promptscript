# EnvProvider

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: EnvProvider

> **EnvProvider** = (`name`) => `string` \| `undefined`

Defined in: [parser/src/grammar/visitor.ts:265](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/parser/src/grammar/visitor.ts#L265)

Function type for providing environment variable values.
Returns the value for the given variable name, or undefined if not set.

## Parameters

### name

`string`

## Returns

`string` \| `undefined`