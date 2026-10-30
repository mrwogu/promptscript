# validateGovernanceFields()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: validateGovernanceFields()

> **validateGovernanceFields**(`fields`): `string`[]

Defined in: [core/src/prompt-definitions.ts:478](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/prompt-definitions.ts#L478)

Check governance fields of `@meta`, which act as defaults for prompts.

## Parameters

### fields

`Record`\<`string`, [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)\>

The `@meta` fields

## Returns

`string`[]

One message per invalid value