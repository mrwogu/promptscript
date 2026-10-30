# mergeBlockCollections()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: mergeBlockCollections()

> **mergeBlockCollections**(`base`, `incoming`, `policy`): [`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md)[]

Defined in: [core/src/block-merge.ts:573](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/block-merge.ts#L573)

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