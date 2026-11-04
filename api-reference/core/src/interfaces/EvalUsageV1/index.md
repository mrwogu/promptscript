# EvalUsageV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalUsageV1

Defined in: [core/src/types/eval.ts:419](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L419)

Calls and tokens of a run, a model entry or a case.

## Extends

- [`EvalTokenUsageV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalTokenUsageV1/index.md)

## Properties

### calls

> **calls**: `number`

Defined in: [core/src/types/eval.ts:425](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L425)

Model calls, cache hits included.

#### As Type

integer

#### Minimum

0

***

### inputTokens

> **inputTokens**: `number`

Defined in: [core/src/types/eval.ts:347](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L347)

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

Defined in: [core/src/types/eval.ts:353](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L353)

Output tokens.

#### As Type

integer

#### Minimum

0

#### Inherited from

[`EvalTokenUsageV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalTokenUsageV1/index.md).[`outputTokens`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalTokenUsageV1/index.md#outputtokens)