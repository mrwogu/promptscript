# EvalImportSkippedV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalImportSkippedV1

Defined in: [core/src/types/eval-import.ts:72](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval-import.ts#L72)

Samples dropped, by reason.

## Properties

### duplicate

> **duplicate**: `number`

Defined in: [core/src/types/eval-import.ts:94](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval-import.ts#L94)

Same scrubbed inputs as an earlier sample

***

### filteredLabel

> **filteredLabel**: `number`

Defined in: [core/src/types/eval-import.ts:82](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval-import.ts#L82)

The feedback label is not one of `--label` or absent

***

### filteredScore

> **filteredScore**: `number`

Defined in: [core/src/types/eval-import.ts:80](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval-import.ts#L80)

The feedback score is above `--max-score` or absent

***

### inputMismatch

> **inputMismatch**: `number`

Defined in: [core/src/types/eval-import.ts:86](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval-import.ts#L86)

An input has another type, or a required input is missing

***

### invalidJson

> **invalidJson**: `number`

Defined in: [core/src/types/eval-import.ts:74](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval-import.ts#L74)

The line is not JSON

***

### invalidSample

> **invalidSample**: `number`

Defined in: [core/src/types/eval-import.ts:76](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval-import.ts#L76)

The line breaks the sample schema or a size limit, before or after the scrub

***

### numericPii

> **numericPii**: `number`

Defined in: [core/src/types/eval-import.ts:90](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval-import.ts#L90)

A number input has 13 or more digits, so it could be a card number, and it cannot be replaced without changing its type

***

### obfuscatedPii

> **obfuscatedPii**: `number`

Defined in: [core/src/types/eval-import.ts:92](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval-import.ts#L92)

A value hides personal data with zero-width characters, fullwidth forms or dots

***

### otherPrompt

> **otherPrompt**: `number`

Defined in: [core/src/types/eval-import.ts:78](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval-import.ts#L78)

The sample is of another prompt

***

### sampledOut

> **sampledOut**: `number`

Defined in: [core/src/types/eval-import.ts:96](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval-import.ts#L96)

Left out by sampling down to `--max-rows`

***

### staleContract

> **staleContract**: `number`

Defined in: [core/src/types/eval-import.ts:88](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval-import.ts#L88)

The sample fits the bundle of its hash but not the current prompt, so a run would refuse the row

***

### undeclaredInput

> **undeclaredInput**: `number`

Defined in: [core/src/types/eval-import.ts:84](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval-import.ts#L84)

An input the prompt does not declare