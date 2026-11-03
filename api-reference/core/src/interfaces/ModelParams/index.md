# ModelParams

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ModelParams

Defined in: [core/src/types/prompts.ts:36](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/prompts.ts#L36)

Invocation parameters of a model.

## Properties

### maxTokens?

> `optional` **maxTokens?**: `number`

Defined in: [core/src/types/prompts.ts:52](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/prompts.ts#L52)

Maximum number of tokens to generate.

#### As Type

integer

#### Minimum

1

***

### seed?

> `optional` **seed?**: `number`

Defined in: [core/src/types/prompts.ts:61](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/prompts.ts#L61)

Sampling seed, at most 2^53-1.

#### As Type

integer

#### Minimum

0

#### Maximum

9007199254740991

***

### stop?

> `optional` **stop?**: `string`[]

Defined in: [core/src/types/prompts.ts:54](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/prompts.ts#L54)

Stop sequences, in authored order

***

### temperature?

> `optional` **temperature?**: `number`

Defined in: [core/src/types/prompts.ts:38](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/prompts.ts#L38)

Sampling temperature

***

### topK?

> `optional` **topK?**: `number`

Defined in: [core/src/types/prompts.ts:46](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/prompts.ts#L46)

Top-k sampling cutoff.

#### As Type

integer

#### Minimum

1

***

### topP?

> `optional` **topP?**: `number`

Defined in: [core/src/types/prompts.ts:40](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/prompts.ts#L40)

Nucleus sampling threshold