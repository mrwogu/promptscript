# PullOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PullOptions

Defined in: [cli/src/types.ts:133](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/types.ts#L133)

Options for the pull command.

## Properties

### branch?

> `optional` **branch?**: `string`

Defined in: [cli/src/types.ts:139](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/types.ts#L139)

Git branch to pull from

***

### commit?

> `optional` **commit?**: `string`

Defined in: [cli/src/types.ts:143](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/types.ts#L143)

Git commit hash to pull from

***

### dryRun?

> `optional` **dryRun?**: `boolean`

Defined in: [cli/src/types.ts:137](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/types.ts#L137)

Preview changes without pulling

***

### force?

> `optional` **force?**: `boolean`

Defined in: [cli/src/types.ts:135](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/types.ts#L135)

Force overwrite local files

***

### refresh?

> `optional` **refresh?**: `boolean`

Defined in: [cli/src/types.ts:145](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/types.ts#L145)

Force refresh/re-fetch from remote registry

***

### tag?

> `optional` **tag?**: `string`

Defined in: [cli/src/types.ts:141](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/types.ts#L141)

Git tag to pull from