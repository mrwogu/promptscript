# PromptReleasePricingV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptReleasePricingV1

Defined in: [core/src/types/prompt-pricing.ts:40](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/prompt-pricing.ts#L40)

List prices of the models that the bundles of a release use, version 1.
Outside every content hash: a price update never changes a bundle. The prices are
estimates, cache, batch and tier discounts are ignored.

## Properties

### $schema

> **$schema**: `"https://getpromptscript.dev/schema/prompt-release-pricing/v1.json"`

Defined in: [core/src/types/prompt-pricing.ts:45](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/prompt-pricing.ts#L45)

Schema URL, the version tag of the file.

#### Example

```ts
"https://getpromptscript.dev/schema/prompt-release-pricing/v1.json"
```

***

### models

> **models**: [`PromptReleasePricingModel`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptReleasePricingModel/index.md)[]

Defined in: [core/src/types/prompt-pricing.ts:47](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/prompt-pricing.ts#L47)

Priced models sorted by ref. Models without a known price are left out.