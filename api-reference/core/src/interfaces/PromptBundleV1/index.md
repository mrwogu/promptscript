# PromptBundleV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptBundleV1

Defined in: [core/src/types/prompt-bundle.ts:112](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/prompt-bundle.ts#L112)

A portable, content-hashed prompt bundle, version 1.

`contentHash` is SHA-256 over the RFC 8785 canonical JSON of every field
except `contentHash` and `provenance`.

## Properties

### $schema

> **$schema**: `"https://getpromptscript.dev/schema/prompt-bundle/v1.json"`

Defined in: [core/src/types/prompt-bundle.ts:117](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/prompt-bundle.ts#L117)

Schema URL, the version tag of the bundle.

#### Example

```ts
"https://getpromptscript.dev/schema/prompt-bundle/v1.json"
```

***

### contentHash

> **contentHash**: `string`

Defined in: [core/src/types/prompt-bundle.ts:129](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/prompt-bundle.ts#L129)

Content hash: `sha256-` plus 64 lowercase hex characters.

#### Pattern

^sha256-[0-9a-f]{64}$

***

### description

> **description**: `string`

Defined in: [core/src/types/prompt-bundle.ts:124](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/prompt-bundle.ts#L124)

What the prompt does

***

### governance

> **governance**: [`GovernanceMeta`](https://getpromptscript.dev/api-reference/core/src/interfaces/GovernanceMeta/index.md)

Defined in: [core/src/types/prompt-bundle.ts:143](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/prompt-bundle.ts#L143)

Effective governance: the entry value, else the file-level default. Lists are sorted and deduplicated.

***

### id

> **id**: `string`

Defined in: [core/src/types/prompt-bundle.ts:122](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/prompt-bundle.ts#L122)

Prompt id, `<@meta.id>/<key>`.

#### Example

```ts
"acme-support/refund-reply"
```

***

### inputs

> **inputs**: `Record`\<`string`, [`PromptBundleInput`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptBundleInput/index.md)\>

Defined in: [core/src/types/prompt-bundle.ts:137](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/prompt-bundle.ts#L137)

Declared runtime inputs by name

***

### messages

> **messages**: [`PromptBundleMessage`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptBundleMessage/index.md)[]

Defined in: [core/src/types/prompt-bundle.ts:135](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/prompt-bundle.ts#L135)

One or two messages, system first.

#### Min Items

1

#### Max Items

2

***

### model?

> `optional` **model?**: [`PromptBundleModel`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptBundleModel/index.md)

Defined in: [core/src/types/prompt-bundle.ts:141](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/prompt-bundle.ts#L141)

Model identity and parameters

***

### output?

> `optional` **output?**: [`PromptBundleOutput`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptBundleOutput/index.md)

Defined in: [core/src/types/prompt-bundle.ts:139](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/prompt-bundle.ts#L139)

Output contract

***

### provenance

> **provenance**: [`PromptBundleProvenance`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptBundleProvenance/index.md)

Defined in: [core/src/types/prompt-bundle.ts:145](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/prompt-bundle.ts#L145)

Provenance of the messages