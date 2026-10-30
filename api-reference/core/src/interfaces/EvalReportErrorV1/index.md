# EvalReportErrorV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalReportErrorV1

Defined in: [core/src/types/eval.ts:454](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/eval.ts#L454)

An error of a run that is not tied to one case.

## Properties

### code

> **code**: `string`

Defined in: [core/src/types/eval.ts:460](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/eval.ts#L460)

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

Defined in: [core/src/types/eval.ts:464](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/eval.ts#L464)

File the error is about, relative to the project root

***

### line?

> `optional` **line?**: `number`

Defined in: [core/src/types/eval.ts:470](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/eval.ts#L470)

Line in the file.

#### As Type

integer

#### Minimum

1

***

### message

> **message**: `string`

Defined in: [core/src/types/eval.ts:462](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/eval.ts#L462)

What went wrong and what to do