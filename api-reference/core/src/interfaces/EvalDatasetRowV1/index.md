# EvalDatasetRowV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalDatasetRowV1

Defined in: [core/src/types/eval.ts:13](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L13)

One row of an eval dataset, version 1: a JSONL line, a YAML item or a
CSV row.

## Properties

### expected?

> `optional` **expected?**: `string` \| `Record`\<`string`, [`EvalExpectedValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalExpectedValue/index.md)\>

Defined in: [core/src/types/eval.ts:28](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L28)

Golden answer: the whole response text, or the expected output
properties when the prompt has an output contract. A partial object
is allowed.

***

### id?

> `optional` **id?**: `string`

Defined in: [core/src/types/eval.ts:20](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L20)

Row id, unique in the dataset. Absent ids default to `row-<n>`,
counted from 1 in file order.

#### Pattern

^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$

#### Example

```ts
"late-delivery"
```

***

### inputs

> **inputs**: `Record`\<`string`, [`EvalInputValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalInputValue/index.md)\>

Defined in: [core/src/types/eval.ts:22](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L22)

Prompt input values by input name

***

### tags?

> `optional` **tags?**: `string`[]

Defined in: [core/src/types/eval.ts:30](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L30)

Free-form tags, for filtering and reporting