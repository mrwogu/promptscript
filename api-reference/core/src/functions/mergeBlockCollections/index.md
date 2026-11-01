# mergeBlockCollections()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: mergeBlockCollections()

> **mergeBlockCollections**(`base`, `incoming`, `policy`): [`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md)[]

Defined in: [core/src/block-merge.ts:573](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/block-merge.ts#L573)

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