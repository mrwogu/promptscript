# EvalSuiteV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalSuiteV1

Defined in: [core/src/types/eval.ts:229](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/eval.ts#L229)

An eval suite file, version 1.

## Properties

### $schema?

> `optional` **$schema?**: `"https://getpromptscript.dev/schema/eval-suite/v1.json"`

Defined in: [core/src/types/eval.ts:234](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/eval.ts#L234)

Schema URL, the version tag of the suite.

#### Example

```ts
"https://getpromptscript.dev/schema/eval-suite/v1.json"
```

***

### assertions

> **assertions**: [`EvalAssertion`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalAssertion/index.md)[]

Defined in: [core/src/types/eval.ts:260](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/eval.ts#L260)

Assertions every case must pass.

#### Min Items

1

#### Max Items

20

***

### dataset

> **dataset**: `string` \| [`EvalDatasetRef`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalDatasetRef/index.md)

Defined in: [core/src/types/eval.ts:241](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/eval.ts#L241)

Dataset file relative to the suite file, or a reference with review decisions

***

### judge?

> `optional` **judge?**: [`EvalJudgeConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalJudgeConfig/index.md)

Defined in: [core/src/types/eval.ts:254](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/eval.ts#L254)

Judge settings shared by the llm-judge assertions

***

### labels?

> `optional` **labels?**: `string`

Defined in: [core/src/types/eval.ts:246](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/eval.ts#L246)

Human label file, relative to the suite file.

#### Example

```ts
"labels/refund-reply.jsonl"
```

***

### models?

> `optional` **models?**: (`string` \| [`EvalModelEntry`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalModelEntry/index.md))[]

Defined in: [core/src/types/eval.ts:252](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/eval.ts#L252)

Models to run the whole dataset on; absent means the prompt's own model.

#### Min Items

1

#### Max Items

8

***

### prompt

> **prompt**: `string`

Defined in: [core/src/types/eval.ts:239](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/eval.ts#L239)

Prompt id under test.

#### Example

```ts
"acme-support/refund-reply"
```

***

### thresholds?

> `optional` **thresholds?**: [`EvalThresholds`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalThresholds/index.md)

Defined in: [core/src/types/eval.ts:262](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/eval.ts#L262)

Limits the run must meet