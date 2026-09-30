# toNativeAgentName()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: toNativeAgentName()

> **toNativeAgentName**(`name`): `string`

Defined in: [core/src/agent-names.ts:46](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/agent-names.ts#L46)

Convert a PromptScript agent name into a portable native identifier.

Dots are namespace separators in qualified names, so native targets use
hyphens to avoid target-specific nested-path semantics.

## Parameters

### name

`string`

## Returns

`string`