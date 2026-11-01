# isPromptTarget()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isPromptTarget()

> **isPromptTarget**(`name`): `boolean`

Defined in: [core/src/target-catalog.ts:909](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/target-catalog.ts#L909)

Whether a target name is a built-in prompt target (`bundle`, `prompt-text`).
Prompt targets are opt-in: no "all formatters" default includes them.

## Parameters

### name

`string`

Any target name, built-in or custom

## Returns

`boolean`

True for a built-in target of the `prompt` family