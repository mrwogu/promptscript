# PromptBundleModel

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptBundleModel

Defined in: [core/src/types/prompt-bundle.ts:60](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/prompt-bundle.ts#L60)

Model identity of a prompt bundle: the authored reference plus what it resolved to.

## Properties

### apiId

> **apiId**: `string`

Defined in: [core/src/types/prompt-bundle.ts:77](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/prompt-bundle.ts#L77)

Resolved provider API model identifier.

#### Example

```ts
"claude-sonnet-5-5"
```

***

### params

> **params**: [`ModelParams`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelParams/index.md)

Defined in: [core/src/types/prompt-bundle.ts:79](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/prompt-bundle.ts#L79)

Invocation parameters

***

### profile?

> `optional` **profile?**: `string`

Defined in: [core/src/types/prompt-bundle.ts:67](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/prompt-bundle.ts#L67)

Catalog profile id the reference resolved to, when one matched

***

### provider

> **provider**: `string`

Defined in: [core/src/types/prompt-bundle.ts:72](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/prompt-bundle.ts#L72)

Resolved model provider.

#### Example

```ts
"anthropic"
```

***

### ref

> **ref**: `string`

Defined in: [core/src/types/prompt-bundle.ts:65](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/prompt-bundle.ts#L65)

Reference as authored.

#### Example

```ts
"claude-sonnet-5-5"
```