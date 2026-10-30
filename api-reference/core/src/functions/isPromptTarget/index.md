# isPromptTarget()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isPromptTarget()

> **isPromptTarget**(`name`): `boolean`

Defined in: [core/src/target-catalog.ts:909](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/target-catalog.ts#L909)

Whether a target name is a built-in prompt target (`bundle`, `prompt-text`).
Prompt targets are opt-in: no "all formatters" default includes them.

## Parameters

### name

`string`

Any target name, built-in or custom

## Returns

`boolean`

True for a built-in target of the `prompt` family