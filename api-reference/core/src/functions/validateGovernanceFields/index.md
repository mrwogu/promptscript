# validateGovernanceFields()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: validateGovernanceFields()

> **validateGovernanceFields**(`fields`): `string`[]

Defined in: [core/src/prompt-definitions.ts:478](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/prompt-definitions.ts#L478)

Check governance fields of `@meta`, which act as defaults for prompts.

## Parameters

### fields

`Record`\<`string`, [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)\>

The `@meta` fields

## Returns

`string`[]

One message per invalid value