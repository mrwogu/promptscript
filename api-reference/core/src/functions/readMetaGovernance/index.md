# readMetaGovernance()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: readMetaGovernance()

> **readMetaGovernance**(`fields`): [`GovernanceMeta`](https://getpromptscript.dev/api-reference/core/src/interfaces/GovernanceMeta/index.md)

Defined in: [core/src/prompt-definitions.ts:491](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/prompt-definitions.ts#L491)

Read the governance defaults of `@meta`. Invalid values are left out, see
[validateGovernanceFields](https://getpromptscript.dev/api-reference/core/src/functions/validateGovernanceFields/index.md) for the messages.

## Parameters

### fields

`Record`\<`string`, [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)\>

The `@meta` fields

## Returns

[`GovernanceMeta`](https://getpromptscript.dev/api-reference/core/src/interfaces/GovernanceMeta/index.md)

The valid governance fields