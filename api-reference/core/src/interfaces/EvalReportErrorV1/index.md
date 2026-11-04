# EvalReportErrorV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalReportErrorV1

Defined in: [core/src/types/eval.ts:474](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L474)

An error of a run that is not tied to one case.

## Properties

### code

> **code**: `string`

Defined in: [core/src/types/eval.ts:480](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L480)

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

Defined in: [core/src/types/eval.ts:484](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L484)

File the error is about, relative to the project root

***

### line?

> `optional` **line?**: `number`

Defined in: [core/src/types/eval.ts:490](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L490)

Line in the file.

#### As Type

integer

#### Minimum

1

***

### message

> **message**: `string`

Defined in: [core/src/types/eval.ts:482](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L482)

What went wrong and what to do