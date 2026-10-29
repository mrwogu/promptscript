# mergeBlockCollections()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: mergeBlockCollections()

> **mergeBlockCollections**(`base`, `incoming`, `policy`): [`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md)[]

Defined in: [core/src/block-merge.ts:573](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/block-merge.ts#L573)

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