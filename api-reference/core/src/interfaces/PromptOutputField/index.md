# PromptOutputField

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptOutputField

Defined in: [core/src/types/prompts.ts:73](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/prompts.ts#L73)

One field of a prompt output.

## Properties

### description

> **description**: `string`

Defined in: [core/src/types/prompts.ts:75](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/prompts.ts#L75)

Description of the field

***

### items?

> `optional` **items?**: `object`

Defined in: [core/src/types/prompts.ts:81](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/prompts.ts#L81)

Item type of a list

#### options?

> `optional` **options?**: `string`[]

#### type

> **type**: `"string"` \| `"number"` \| `"boolean"` \| `"enum"`

***

### options?

> `optional` **options?**: `string`[]

Defined in: [core/src/types/prompts.ts:79](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/prompts.ts#L79)

Options for enum type

***

### type

> **type**: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"`

Defined in: [core/src/types/prompts.ts:77](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/prompts.ts#L77)

Value type, `list` holds items of one scalar type