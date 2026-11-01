# ValidateReportV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ValidateReportV1

Defined in: [core/src/types/validate-report.ts:71](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/validate-report.ts#L71)

Report of `prs validate --format json`, version 1.

## Properties

### $schema

> **$schema**: `"https://getpromptscript.dev/schema/validate-report/v1.json"`

Defined in: [core/src/types/validate-report.ts:73](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/validate-report.ts#L73)

Schema URL, the version tag of the report

***

### errors

> **errors**: [`ValidateErrorV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/ValidateErrorV1/index.md)[]

Defined in: [core/src/types/validate-report.ts:79](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/validate-report.ts#L79)

Errors of all validated files, in file order

***

### success

> **success**: `boolean`

Defined in: [core/src/types/validate-report.ts:77](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/validate-report.ts#L77)

False when there are errors, or warnings under `--strict`

***

### summary

> **summary**: [`ValidateSummaryV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/ValidateSummaryV1/index.md)

Defined in: [core/src/types/validate-report.ts:83](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/validate-report.ts#L83)

Counts of errors and warnings

***

### version

> **version**: `1`

Defined in: [core/src/types/validate-report.ts:75](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/validate-report.ts#L75)

Major version of the report format, always 1

***

### warnings

> **warnings**: [`ValidateWarningV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/ValidateWarningV1/index.md)[]

Defined in: [core/src/types/validate-report.ts:81](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/validate-report.ts#L81)

Warnings of all validated files, in file order