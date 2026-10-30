# PromptReleaseExperiment

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptReleaseExperiment

Defined in: [core/src/types/prompt-bundle.ts:255](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/prompt-bundle.ts#L255)

Weighted arms an entry of a v2 label splits its traffic over.

## Properties

### arms

> **arms**: \[[`PromptReleaseControlArm`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptReleaseControlArm/index.md), [`PromptReleaseVariantArm`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptReleaseVariantArm/index.md)\] \| \[[`PromptReleaseControlArm`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptReleaseControlArm/index.md), [`PromptReleaseVariantArm`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptReleaseVariantArm/index.md), [`PromptReleaseVariantArm`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptReleaseVariantArm/index.md)\] \| \[[`PromptReleaseControlArm`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptReleaseControlArm/index.md), [`PromptReleaseVariantArm`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptReleaseVariantArm/index.md), [`PromptReleaseVariantArm`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptReleaseVariantArm/index.md), [`PromptReleaseVariantArm`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptReleaseVariantArm/index.md)\]

Defined in: [core/src/types/prompt-bundle.ts:265](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/prompt-bundle.ts#L265)

The control arm first, then 1 to 3 variants. Weights are integers and sum to 10000;
arm names and hashes are unique. Readers check what the schema cannot.

***

### name

> **name**: `string`

Defined in: [core/src/types/prompt-bundle.ts:260](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/prompt-bundle.ts#L260)

Experiment name.

#### Pattern

^[a-z0-9][a-z0-9-]{0,63}$