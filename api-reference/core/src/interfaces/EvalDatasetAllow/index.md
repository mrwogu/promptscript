# EvalDatasetAllow

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalDatasetAllow

Defined in: [core/src/types/eval.ts:34](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L34)

A dataset scan rule the suite owner expects to fire, with the reason.

## Properties

### reason

> **reason**: `string`

Defined in: [core/src/types/eval.ts:46](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L46)

Why the content is expected; copied into the report.

#### Min Length

1

#### Max Length

500

***

### rule

> **rule**: `string`

Defined in: [core/src/types/eval.ts:40](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L40)

Validator rule id whose findings are expected in the dataset.

#### Pattern

^PS\d{3,4}$

#### Example

```ts
"PS005"
```