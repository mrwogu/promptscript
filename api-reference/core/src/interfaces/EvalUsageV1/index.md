# EvalUsageV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalUsageV1

Defined in: [core/src/types/eval.ts:399](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/eval.ts#L399)

Calls and tokens of a run, a model entry or a case.

## Extends

- [`EvalTokenUsageV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalTokenUsageV1/index.md)

## Properties

### calls

> **calls**: `number`

Defined in: [core/src/types/eval.ts:405](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/eval.ts#L405)

Model calls, cache hits included.

#### As Type

integer

#### Minimum

0

***

### inputTokens

> **inputTokens**: `number`

Defined in: [core/src/types/eval.ts:339](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/eval.ts#L339)

Input tokens.

#### As Type

integer

#### Minimum

0

#### Inherited from

[`EvalTokenUsageV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalTokenUsageV1/index.md).[`inputTokens`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalTokenUsageV1/index.md#inputtokens)

***

### outputTokens

> **outputTokens**: `number`

Defined in: [core/src/types/eval.ts:345](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/eval.ts#L345)

Output tokens.

#### As Type

integer

#### Minimum

0

#### Inherited from

[`EvalTokenUsageV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalTokenUsageV1/index.md).[`outputTokens`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalTokenUsageV1/index.md#outputtokens)