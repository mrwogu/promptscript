# ValidateErrorV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ValidateErrorV1

Defined in: [core/src/types/validate-report.ts:26](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/validate-report.ts#L26)

One error of `prs validate`.

## Properties

### cause?

> `optional` **cause?**: `string`

Defined in: [core/src/types/validate-report.ts:38](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/validate-report.ts#L38)

Code of the underlying error, when the error wraps another one. A parse error reaches
the report as `PS2000` with `cause` set to the parser code, such as `PS1000`.

#### Pattern

^PS[0-9]{3,4}$

***

### code?

> `optional` **code?**: `string`

Defined in: [core/src/types/validate-report.ts:32](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/validate-report.ts#L32)

Error code, such as `PS2000`. Absent when the run stops before the compile with an error
that has no PS code, for example a missing entry file or a registry clone failure.

#### Pattern

^PS[0-9]{3,4}$

***

### location?

> `optional` **location?**: [`ValidateLocationV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/ValidateLocationV1/index.md)

Defined in: [core/src/types/validate-report.ts:42](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/validate-report.ts#L42)

Where the error is, when the compiler knows

***

### message

> **message**: `string`

Defined in: [core/src/types/validate-report.ts:40](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/validate-report.ts#L40)

Error message