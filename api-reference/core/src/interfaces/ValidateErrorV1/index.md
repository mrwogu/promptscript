# ValidateErrorV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ValidateErrorV1

Defined in: [core/src/types/validate-report.ts:26](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/validate-report.ts#L26)

One error of `prs validate`.

## Properties

### code?

> `optional` **code?**: `string`

Defined in: [core/src/types/validate-report.ts:32](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/validate-report.ts#L32)

Error code, such as `PS2000`. Absent when the run stops before the compile with an error
that has no PS code, for example a missing entry file or a registry clone failure.

#### Pattern

^PS[0-9]{3,4}$

***

### location?

> `optional` **location?**: [`ValidateLocationV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/ValidateLocationV1/index.md)

Defined in: [core/src/types/validate-report.ts:36](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/validate-report.ts#L36)

Where the error is, when the compiler knows

***

### message

> **message**: `string`

Defined in: [core/src/types/validate-report.ts:34](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/validate-report.ts#L34)

Error message