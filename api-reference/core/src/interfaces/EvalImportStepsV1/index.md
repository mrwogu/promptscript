# EvalImportStepsV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalImportStepsV1

Defined in: [core/src/types/eval-import.ts:54](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval-import.ts#L54)

Counts of the import steps, in the order the steps run.

## Properties

### filtered

> **filtered**: `number`

Defined in: [core/src/types/eval-import.ts:62](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval-import.ts#L62)

Samples left after `--max-score` and `--label`

***

### fitted

> **fitted**: `number`

Defined in: [core/src/types/eval-import.ts:64](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval-import.ts#L64)

Samples whose inputs fit the prompt

***

### forPrompt

> **forPrompt**: `number`

Defined in: [core/src/types/eval-import.ts:60](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval-import.ts#L60)

Samples of the suite's prompt

***

### read

> **read**: `number`

Defined in: [core/src/types/eval-import.ts:56](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval-import.ts#L56)

Non-blank lines read

***

### sampled

> **sampled**: `number`

Defined in: [core/src/types/eval-import.ts:68](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval-import.ts#L68)

Rows written, or that would be written

***

### unique

> **unique**: `number`

Defined in: [core/src/types/eval-import.ts:66](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval-import.ts#L66)

Samples left after the duplicates are dropped

***

### valid

> **valid**: `number`

Defined in: [core/src/types/eval-import.ts:58](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval-import.ts#L58)

Lines that passed the sample schema