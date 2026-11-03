# ValidateReportV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ValidateReportV1

Defined in: [core/src/types/validate-report.ts:77](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/validate-report.ts#L77)

Report of `prs validate --format json`, version 1.

## Properties

### $schema

> **$schema**: `"https://getpromptscript.dev/schema/validate-report/v1.json"`

Defined in: [core/src/types/validate-report.ts:79](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/validate-report.ts#L79)

Schema URL, the version tag of the report

***

### errors

> **errors**: [`ValidateErrorV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/ValidateErrorV1/index.md)[]

Defined in: [core/src/types/validate-report.ts:85](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/validate-report.ts#L85)

Errors of all validated files, in file order

***

### success

> **success**: `boolean`

Defined in: [core/src/types/validate-report.ts:83](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/validate-report.ts#L83)

False when there are errors, or warnings under `--strict`

***

### summary

> **summary**: [`ValidateSummaryV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/ValidateSummaryV1/index.md)

Defined in: [core/src/types/validate-report.ts:89](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/validate-report.ts#L89)

Counts of errors and warnings

***

### version

> **version**: `1`

Defined in: [core/src/types/validate-report.ts:81](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/validate-report.ts#L81)

Major version of the report format, always 1

***

### warnings

> **warnings**: [`ValidateWarningV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/ValidateWarningV1/index.md)[]

Defined in: [core/src/types/validate-report.ts:87](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/validate-report.ts#L87)

Warnings of all validated files, in file order