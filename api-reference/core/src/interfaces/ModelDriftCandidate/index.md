# ModelDriftCandidate

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ModelDriftCandidate

Defined in: [core/src/model-drift.ts:46](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/model-drift.ts#L46)

A new release of a family the catalog already tracks.

## Properties

### displayName

> `readonly` **displayName**: `string`

Defined in: [core/src/model-drift.ts:54](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/model-drift.ts#L54)

***

### family

> `readonly` **family**: `string`

Defined in: [core/src/model-drift.ts:49](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/model-drift.ts#L49)

The catalog family the release belongs to.

***

### id

> `readonly` **id**: `string`

Defined in: [core/src/model-drift.ts:53](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/model-drift.ts#L53)

Catalog id for the new release.

***

### pricing?

> `readonly` `optional` **pricing?**: [`OpenRouterPricing`](https://getpromptscript.dev/api-reference/core/src/type-aliases/OpenRouterPricing/index.md)

Defined in: [core/src/model-drift.ts:58](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/model-drift.ts#L58)

List price OpenRouter carries, to be verified against the provider page.

***

### provider

> `readonly` **provider**: `string`

Defined in: [core/src/model-drift.ts:47](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/model-drift.ts#L47)

***

### releaseDate

> `readonly` **releaseDate**: `string`

Defined in: [core/src/model-drift.ts:55](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/model-drift.ts#L55)

***

### retirementDate?

> `readonly` `optional` **retirementDate?**: `string`

Defined in: [core/src/model-drift.ts:56](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/model-drift.ts#L56)

***

### version

> `readonly` **version**: `string`

Defined in: [core/src/model-drift.ts:51](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/model-drift.ts#L51)

Version inside the family (e.g. '4.5').