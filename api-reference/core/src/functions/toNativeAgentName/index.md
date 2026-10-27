# toNativeAgentName()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: toNativeAgentName()

> **toNativeAgentName**(`name`): `string`

Defined in: [core/src/agent-names.ts:46](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/agent-names.ts#L46)

Convert a PromptScript agent name into a portable native identifier.

Dots are namespace separators in qualified names, so native targets use
hyphens to avoid target-specific nested-path semantics.

## Parameters

### name

`string`

## Returns

`string`