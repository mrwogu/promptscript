# EvalReportErrorV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalReportErrorV1

Defined in: [core/src/types/eval.ts:454](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L454)

An error of a run that is not tied to one case.

## Properties

### code

> **code**: `string`

Defined in: [core/src/types/eval.ts:460](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L460)

Error code.

#### Pattern

^PS\d{3,4}$

#### Example

```ts
"PS6202"
```

***

### file?

> `optional` **file?**: `string`

Defined in: [core/src/types/eval.ts:464](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L464)

File the error is about, relative to the project root

***

### line?

> `optional` **line?**: `number`

Defined in: [core/src/types/eval.ts:470](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L470)

Line in the file.

#### As Type

integer

#### Minimum

1

***

### message

> **message**: `string`

Defined in: [core/src/types/eval.ts:462](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L462)

What went wrong and what to do