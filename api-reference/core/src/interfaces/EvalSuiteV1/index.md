# EvalSuiteV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalSuiteV1

Defined in: [core/src/types/eval.ts:233](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/eval.ts#L233)

An eval suite file, version 1.

## Properties

### $schema?

> `optional` **$schema?**: `"https://getpromptscript.dev/schema/eval-suite/v1.json"`

Defined in: [core/src/types/eval.ts:238](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/eval.ts#L238)

Schema URL, the version tag of the suite.

#### Example

```ts
"https://getpromptscript.dev/schema/eval-suite/v1.json"
```

***

### assertions

> **assertions**: [`EvalAssertion`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalAssertion/index.md)[]

Defined in: [core/src/types/eval.ts:264](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/eval.ts#L264)

Assertions every case must pass.

#### Min Items

1

#### Max Items

20

***

### dataset

> **dataset**: `string` \| [`EvalDatasetRef`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalDatasetRef/index.md)

Defined in: [core/src/types/eval.ts:245](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/eval.ts#L245)

Dataset file relative to the suite file, or a reference with review decisions

***

### judge?

> `optional` **judge?**: [`EvalJudgeConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalJudgeConfig/index.md)

Defined in: [core/src/types/eval.ts:258](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/eval.ts#L258)

Judge settings shared by the llm-judge assertions

***

### labels?

> `optional` **labels?**: `string`

Defined in: [core/src/types/eval.ts:250](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/eval.ts#L250)

Human label file, relative to the suite file.

#### Example

```ts
"labels/refund-reply.jsonl"
```

***

### models?

> `optional` **models?**: (`string` \| [`EvalModelEntry`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalModelEntry/index.md))[]

Defined in: [core/src/types/eval.ts:256](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/eval.ts#L256)

Models to run the whole dataset on; absent means the prompt's own model.

#### Min Items

1

#### Max Items

8

***

### prompt

> **prompt**: `string`

Defined in: [core/src/types/eval.ts:243](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/eval.ts#L243)

Prompt id under test.

#### Example

```ts
"acme-support/refund-reply"
```

***

### thresholds?

> `optional` **thresholds?**: [`EvalThresholds`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalThresholds/index.md)

Defined in: [core/src/types/eval.ts:266](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/eval.ts#L266)

Limits the run must meet