# PullOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PullOptions

Defined in: [cli/src/types.ts:118](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/types.ts#L118)

Options for the pull command.

## Properties

### branch?

> `optional` **branch?**: `string`

Defined in: [cli/src/types.ts:124](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/types.ts#L124)

Git branch to pull from

***

### commit?

> `optional` **commit?**: `string`

Defined in: [cli/src/types.ts:128](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/types.ts#L128)

Git commit hash to pull from

***

### dryRun?

> `optional` **dryRun?**: `boolean`

Defined in: [cli/src/types.ts:122](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/types.ts#L122)

Preview changes without pulling

***

### force?

> `optional` **force?**: `boolean`

Defined in: [cli/src/types.ts:120](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/types.ts#L120)

Force overwrite local files

***

### refresh?

> `optional` **refresh?**: `boolean`

Defined in: [cli/src/types.ts:130](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/types.ts#L130)

Force refresh/re-fetch from remote registry

***

### tag?

> `optional` **tag?**: `string`

Defined in: [cli/src/types.ts:126](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/types.ts#L126)

Git tag to pull from