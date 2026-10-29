# EvalUsageV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalUsageV1

Defined in: [core/src/types/eval.ts:399](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L399)

Calls and tokens of a run, a model entry or a case.

## Extends

- [`EvalTokenUsageV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalTokenUsageV1/index.md)

## Properties

### calls

> **calls**: `number`

Defined in: [core/src/types/eval.ts:405](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L405)

Model calls, cache hits included.

#### As Type

integer

#### Minimum

0

***

### inputTokens

> **inputTokens**: `number`

Defined in: [core/src/types/eval.ts:339](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L339)

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

Defined in: [core/src/types/eval.ts:345](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L345)

Output tokens.

#### As Type

integer

#### Minimum

0

#### Inherited from

[`EvalTokenUsageV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalTokenUsageV1/index.md).[`outputTokens`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalTokenUsageV1/index.md#outputtokens)