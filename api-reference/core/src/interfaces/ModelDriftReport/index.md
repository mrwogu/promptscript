# ModelDriftReport

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ModelDriftReport

Defined in: [core/src/model-drift.ts:56](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-drift.ts#L56)

Result of comparing OpenRouter's model list with the catalog.

## Properties

### absent

> `readonly` **absent**: readonly `string`[]

Defined in: [core/src/model-drift.ts:62](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-drift.ts#L62)

Catalog releases OpenRouter does not list (informational).

***

### candidates

> `readonly` **candidates**: readonly [`ModelDriftCandidate`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelDriftCandidate/index.md)[]

Defined in: [core/src/model-drift.ts:58](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-drift.ts#L58)

New releases of known families, oldest first.

***

### unmatched

> `readonly` **unmatched**: readonly `string`[]

Defined in: [core/src/model-drift.ts:60](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-drift.ts#L60)

OpenRouter models no catalog family matches (informational).