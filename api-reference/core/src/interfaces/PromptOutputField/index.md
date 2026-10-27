# PromptOutputField

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptOutputField

Defined in: [core/src/types/prompts.ts:69](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/prompts.ts#L69)

One field of a prompt output.

## Properties

### description

> **description**: `string`

Defined in: [core/src/types/prompts.ts:71](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/prompts.ts#L71)

Description of the field

***

### items?

> `optional` **items?**: `object`

Defined in: [core/src/types/prompts.ts:77](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/prompts.ts#L77)

Item type of a list

#### options?

> `optional` **options?**: `string`[]

#### type

> **type**: `"string"` \| `"number"` \| `"boolean"` \| `"enum"`

***

### options?

> `optional` **options?**: `string`[]

Defined in: [core/src/types/prompts.ts:75](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/prompts.ts#L75)

Options for enum type

***

### type

> **type**: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"`

Defined in: [core/src/types/prompts.ts:73](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/prompts.ts#L73)

Value type, `list` holds items of one scalar type