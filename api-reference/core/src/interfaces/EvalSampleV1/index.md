# EvalSampleV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalSampleV1

Defined in: [core/src/types/eval-import.ts:26](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval-import.ts#L26)

One production sample, version 1: a line of the JSONL file `prs eval import`
reads. The schema is closed: there is no field for a comment, an assignment
key, a user, a session or a trace.

## Properties

### contentHash?

> `optional` **contentHash?**: `string`

Defined in: [core/src/types/eval-import.ts:38](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval-import.ts#L38)

Content hash of the served prompt: `sha256-` plus 64 lowercase hex characters.

#### Pattern

^sha256-[0-9a-f]{64}$

***

### feedback?

> `optional` **feedback?**: [`EvalSampleFeedbackV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalSampleFeedbackV1/index.md)

Defined in: [core/src/types/eval-import.ts:50](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval-import.ts#L50)

Feedback on the response

***

### inputs

> **inputs**: `Record`\<`string`, [`EvalInputValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalInputValue/index.md)\>

Defined in: [core/src/types/eval-import.ts:46](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval-import.ts#L46)

Prompt input values by input name; scalars only

***

### output?

> `optional` **output?**: `string`

Defined in: [core/src/types/eval-import.ts:48](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval-import.ts#L48)

Model response text

***

### prompt

> **prompt**: `string`

Defined in: [core/src/types/eval-import.ts:33](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval-import.ts#L33)

Prompt id the sample was served from.

#### Min Length

1

#### Max Length

200

#### Example

```ts
"acme-support/refund-reply"
```

***

### variant?

> `optional` **variant?**: `string`

Defined in: [core/src/types/eval-import.ts:44](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval-import.ts#L44)

Arm of an online experiment, or `control`.

#### Pattern

^(?:control|[a-z][a-z0-9-]{0,31})$

#### Example

```ts
"warm"
```