# PullOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PullOptions

Defined in: [cli/src/types.ts:128](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/cli/src/types.ts#L128)

Options for the pull command.

## Properties

### branch?

> `optional` **branch?**: `string`

Defined in: [cli/src/types.ts:134](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/cli/src/types.ts#L134)

Git branch to pull from

***

### commit?

> `optional` **commit?**: `string`

Defined in: [cli/src/types.ts:138](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/cli/src/types.ts#L138)

Git commit hash to pull from

***

### dryRun?

> `optional` **dryRun?**: `boolean`

Defined in: [cli/src/types.ts:132](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/cli/src/types.ts#L132)

Preview changes without pulling

***

### force?

> `optional` **force?**: `boolean`

Defined in: [cli/src/types.ts:130](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/cli/src/types.ts#L130)

Force overwrite local files

***

### refresh?

> `optional` **refresh?**: `boolean`

Defined in: [cli/src/types.ts:140](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/cli/src/types.ts#L140)

Force refresh/re-fetch from remote registry

***

### tag?

> `optional` **tag?**: `string`

Defined in: [cli/src/types.ts:136](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/cli/src/types.ts#L136)

Git tag to pull from