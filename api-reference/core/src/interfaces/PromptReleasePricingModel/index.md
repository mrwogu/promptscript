# PromptReleasePricingModel

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptReleasePricingModel

Defined in: [core/src/types/prompt-pricing.ts:2](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/prompt-pricing.ts#L2)

One priced model of a release, as `prs release build` writes it.

## Properties

### apiId

> **apiId**: `string`

Defined in: [core/src/types/prompt-pricing.ts:12](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/prompt-pricing.ts#L12)

Provider API model identifier, as the bundles carry it.

#### Example

```ts
"claude-sonnet-5-5"
```

***

### checkedOn

> **checkedOn**: `string`

Defined in: [core/src/types/prompt-pricing.ts:32](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/prompt-pricing.ts#L32)

Date the price was checked against the provider, YYYY-MM-DD.

#### Pattern

^\d{4}-\d{2}-\d{2}$

***

### inputUsdPerMillion

> **inputUsdPerMillion**: `number`

Defined in: [core/src/types/prompt-pricing.ts:22](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/prompt-pricing.ts#L22)

Price of one million input tokens in USD.

#### Minimum

0

***

### outputUsdPerMillion

> **outputUsdPerMillion**: `number`

Defined in: [core/src/types/prompt-pricing.ts:27](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/prompt-pricing.ts#L27)

Price of one million output tokens in USD.

#### Minimum

0

***

### provider

> **provider**: `string`

Defined in: [core/src/types/prompt-pricing.ts:17](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/prompt-pricing.ts#L17)

Model provider.

#### Example

```ts
"anthropic"
```

***

### ref

> **ref**: `string`

Defined in: [core/src/types/prompt-pricing.ts:7](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/prompt-pricing.ts#L7)

Catalog profile id of the model.

#### Example

```ts
"claude-sonnet-5-5"
```