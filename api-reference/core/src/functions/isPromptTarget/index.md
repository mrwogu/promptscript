# isPromptTarget()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isPromptTarget()

> **isPromptTarget**(`name`): `boolean`

Defined in: [core/src/target-catalog.ts:909](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/target-catalog.ts#L909)

Whether a target name is a built-in prompt target (`bundle`, `prompt-text`).
Prompt targets are opt-in: no "all formatters" default includes them.

## Parameters

### name

`string`

Any target name, built-in or custom

## Returns

`boolean`

True for a built-in target of the `prompt` family