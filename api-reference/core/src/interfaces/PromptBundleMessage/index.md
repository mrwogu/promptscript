# PromptBundleMessage

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptBundleMessage

Defined in: [core/src/types/prompt-bundle.ts:8](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/prompt-bundle.ts#L8)

One message of a prompt bundle.

## Properties

### content

> **content**: `string`

Defined in: [core/src/types/prompt-bundle.ts:15](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/prompt-bundle.ts#L15)

Message text with runtime slots left unrendered. Line endings are `\n`.

#### Example

```ts
"Customer wrote: {{input.message}}"
```

***

### role

> **role**: [`PromptBundleRole`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PromptBundleRole/index.md)

Defined in: [core/src/types/prompt-bundle.ts:10](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/prompt-bundle.ts#L10)

Message role