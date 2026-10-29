# isPromptTarget()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isPromptTarget()

> **isPromptTarget**(`name`): `boolean`

Defined in: [core/src/target-catalog.ts:909](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/target-catalog.ts#L909)

Whether a target name is a built-in prompt target (`bundle`, `prompt-text`).
Prompt targets are opt-in: no "all formatters" default includes them.

## Parameters

### name

`string`

Any target name, built-in or custom

## Returns

`boolean`

True for a built-in target of the `prompt` family