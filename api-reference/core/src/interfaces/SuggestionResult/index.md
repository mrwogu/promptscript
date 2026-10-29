# SuggestionResult

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: SuggestionResult

Defined in: [core/src/types/manifest.ts:181](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/manifest.ts#L181)

Result of applying suggestion rules to a project.

## Properties

### inherit?

> `optional` **inherit?**: `string`

Defined in: [core/src/types/manifest.ts:183](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/manifest.ts#L183)

Suggested configuration to inherit

***

### reasoning

> **reasoning**: [`SuggestionReasoning`](https://getpromptscript.dev/api-reference/core/src/interfaces/SuggestionReasoning/index.md)[]

Defined in: [core/src/types/manifest.ts:189](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/manifest.ts#L189)

Reasoning for each suggestion

***

### skills

> **skills**: `string`[]

Defined in: [core/src/types/manifest.ts:187](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/manifest.ts#L187)

Suggested skills to include

***

### use

> **use**: `string`[]

Defined in: [core/src/types/manifest.ts:185](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/manifest.ts#L185)

Suggested fragments to use