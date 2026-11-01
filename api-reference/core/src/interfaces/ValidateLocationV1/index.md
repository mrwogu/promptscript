# ValidateLocationV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ValidateLocationV1

Defined in: [core/src/types/validate-report.ts:2](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/validate-report.ts#L2)

Where a diagnostic points. The file path is as the compiler reports it, usually absolute.

## Properties

### column?

> `optional` **column?**: `number`

Defined in: [core/src/types/validate-report.ts:16](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/validate-report.ts#L16)

Column number. Some parse errors have no position and report -1.

#### As Type

integer

#### Minimum

-1

***

### file?

> `optional` **file?**: `string`

Defined in: [core/src/types/validate-report.ts:4](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/validate-report.ts#L4)

Path of the file

***

### line?

> `optional` **line?**: `number`

Defined in: [core/src/types/validate-report.ts:10](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/validate-report.ts#L10)

Line number. Some parse errors have no position and report -1.

#### As Type

integer

#### Minimum

-1

***

### offset?

> `optional` **offset?**: `number`

Defined in: [core/src/types/validate-report.ts:22](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/validate-report.ts#L22)

Offset from the start of the file, set on some warnings.

#### As Type

integer

#### Minimum

0