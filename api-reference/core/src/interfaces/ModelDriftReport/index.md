# ModelDriftReport

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ModelDriftReport

Defined in: [core/src/model-drift.ts:62](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/model-drift.ts#L62)

Result of comparing OpenRouter's model list with the catalog.

## Properties

### absent

> `readonly` **absent**: readonly `string`[]

Defined in: [core/src/model-drift.ts:68](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/model-drift.ts#L68)

Catalog releases OpenRouter does not list (informational).

***

### candidates

> `readonly` **candidates**: readonly [`ModelDriftCandidate`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelDriftCandidate/index.md)[]

Defined in: [core/src/model-drift.ts:64](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/model-drift.ts#L64)

New releases of known families, oldest first.

***

### unmatched

> `readonly` **unmatched**: readonly `string`[]

Defined in: [core/src/model-drift.ts:66](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/model-drift.ts#L66)

OpenRouter models no catalog family matches (informational).