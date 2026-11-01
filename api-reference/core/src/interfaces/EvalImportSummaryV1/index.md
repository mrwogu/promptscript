# EvalImportSummaryV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalImportSummaryV1

Defined in: [core/src/types/eval-import.ts:109](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval-import.ts#L109)

Summary of `prs eval import --format json`: counts only, never sample values.

## Properties

### $schema

> **$schema**: `"https://getpromptscript.dev/schema/eval-import-summary/v1.json"`

Defined in: [core/src/types/eval-import.ts:111](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval-import.ts#L111)

Schema URL, the version tag of the summary

***

### dryRun

> **dryRun**: `boolean`

Defined in: [core/src/types/eval-import.ts:119](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval-import.ts#L119)

True when nothing was written because of `--dry-run`

***

### findings

> **findings**: [`EvalFindingV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalFindingV1/index.md)[]

Defined in: [core/src/types/eval-import.ts:129](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval-import.ts#L129)

Findings of the dataset security scan; they do not stop the import

***

### out

> **out**: `string`

Defined in: [core/src/types/eval-import.ts:117](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval-import.ts#L117)

Dataset path, relative to the project root

***

### prompt

> **prompt**: `string`

Defined in: [core/src/types/eval-import.ts:115](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval-import.ts#L115)

Prompt id of the suite

***

### replacements

> **replacements**: [`EvalImportReplacementsV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalImportReplacementsV1/index.md)

Defined in: [core/src/types/eval-import.ts:127](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval-import.ts#L127)

Values replaced, by kind

***

### skipped

> **skipped**: [`EvalImportSkippedV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalImportSkippedV1/index.md)

Defined in: [core/src/types/eval-import.ts:125](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval-import.ts#L125)

Samples dropped, by reason

***

### steps

> **steps**: [`EvalImportStepsV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalImportStepsV1/index.md)

Defined in: [core/src/types/eval-import.ts:123](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval-import.ts#L123)

Counts per step

***

### suite

> **suite**: `string`

Defined in: [core/src/types/eval-import.ts:113](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval-import.ts#L113)

Suite name

***

### warnings

> **warnings**: `string`[]

Defined in: [core/src/types/eval-import.ts:131](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval-import.ts#L131)

Warnings, such as a sample file under the project root

***

### written

> **written**: `boolean`

Defined in: [core/src/types/eval-import.ts:121](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval-import.ts#L121)

True when the dataset file was written