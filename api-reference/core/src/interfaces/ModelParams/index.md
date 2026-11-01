# ModelParams

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ModelParams

Defined in: [core/src/types/prompts.ts:32](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/prompts.ts#L32)

Invocation parameters of a model.

## Properties

### maxTokens?

> `optional` **maxTokens?**: `number`

Defined in: [core/src/types/prompts.ts:48](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/prompts.ts#L48)

Maximum number of tokens to generate.

#### As Type

integer

#### Minimum

1

***

### seed?

> `optional` **seed?**: `number`

Defined in: [core/src/types/prompts.ts:57](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/prompts.ts#L57)

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

Defined in: [core/src/types/prompts.ts:50](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/prompts.ts#L50)

Stop sequences, in authored order

***

### temperature?

> `optional` **temperature?**: `number`

Defined in: [core/src/types/prompts.ts:34](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/prompts.ts#L34)

Sampling temperature

***

### topK?

> `optional` **topK?**: `number`

Defined in: [core/src/types/prompts.ts:42](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/prompts.ts#L42)

Top-k sampling cutoff.

#### As Type

integer

#### Minimum

1

***

### topP?

> `optional` **topP?**: `number`

Defined in: [core/src/types/prompts.ts:36](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/prompts.ts#L36)

Nucleus sampling threshold