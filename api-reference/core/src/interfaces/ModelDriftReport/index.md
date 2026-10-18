# ModelDriftReport

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ModelDriftReport

Defined in: [core/src/model-drift.ts:55](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/core/src/model-drift.ts#L55)

Result of comparing OpenRouter's model list with the catalog.

## Properties

### absent

> `readonly` **absent**: readonly `string`[]

Defined in: [core/src/model-drift.ts:61](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/core/src/model-drift.ts#L61)

Catalog releases OpenRouter does not list (informational).

***

### candidates

> `readonly` **candidates**: readonly [`ModelDriftCandidate`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelDriftCandidate/index.md)[]

Defined in: [core/src/model-drift.ts:57](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/core/src/model-drift.ts#L57)

New releases of known families, oldest first.

***

### unmatched

> `readonly` **unmatched**: readonly `string`[]

Defined in: [core/src/model-drift.ts:59](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/core/src/model-drift.ts#L59)

OpenRouter models no catalog family matches (informational).