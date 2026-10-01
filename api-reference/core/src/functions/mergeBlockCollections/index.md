# mergeBlockCollections()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: mergeBlockCollections()

> **mergeBlockCollections**(`base`, `incoming`, `policy`): [`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md)[]

Defined in: [core/src/block-merge.ts:573](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/block-merge.ts#L573)

Compose one matching block across source layers while preserving same-layer duplicates.

## Parameters

### base

readonly [`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md)[]

### incoming

readonly [`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md)[]

### policy

[`BlockCollectionMergePolicy`](https://getpromptscript.dev/api-reference/core/src/interfaces/BlockCollectionMergePolicy/index.md)

## Returns

[`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md)[]