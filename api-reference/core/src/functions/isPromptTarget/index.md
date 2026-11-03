# isPromptTarget()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isPromptTarget()

> **isPromptTarget**(`name`): `boolean`

Defined in: [core/src/target-catalog.ts:913](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/target-catalog.ts#L913)

Whether a target name is a built-in prompt target (`bundle`, `prompt-text`).
Prompt targets are opt-in: no "all formatters" default includes them.

## Parameters

### name

`string`

Any target name, built-in or custom

## Returns

`boolean`

True for a built-in target of the `prompt` family