# PromptReleaseLabelEntryV2

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptReleaseLabelEntryV2

Defined in: [core/src/types/prompt-bundle.ts:277](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/prompt-bundle.ts#L277)

One prompt a v2 release label points at, with an optional experiment.

## Extends

- [`PromptReleaseLabelEntry`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptReleaseLabelEntry/index.md)

## Properties

### contentHash

> **contentHash**: `string`

Defined in: [core/src/types/prompt-bundle.ts:196](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/prompt-bundle.ts#L196)

Content hash of the released bundle.

#### Pattern

^sha256-[0-9a-f]{64}$

#### Inherited from

[`PromptReleaseLabelEntry`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptReleaseLabelEntry/index.md).[`contentHash`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptReleaseLabelEntry/index.md#contenthash)

***

### experiment?

> `optional` **experiment?**: [`PromptReleaseExperiment`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptReleaseExperiment/index.md)

Defined in: [core/src/types/prompt-bundle.ts:279](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/prompt-bundle.ts#L279)

Arms assigned by key. Without a key, readers serve `contentHash`.

***

### id

> **id**: `string`

Defined in: [core/src/types/prompt-bundle.ts:191](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/prompt-bundle.ts#L191)

Prompt id.

#### Example

```ts
"acme-support/refund-reply"
```

#### Inherited from

[`PromptReleaseLabelEntry`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptReleaseLabelEntry/index.md).[`id`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptReleaseLabelEntry/index.md#id)