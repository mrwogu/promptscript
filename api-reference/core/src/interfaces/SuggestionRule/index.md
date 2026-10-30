# SuggestionRule

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: SuggestionRule

Defined in: [core/src/types/manifest.ts:111](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/manifest.ts#L111)

A rule for suggesting configurations.

## Properties

### condition

> **condition**: [`SuggestionCondition`](https://getpromptscript.dev/api-reference/core/src/interfaces/SuggestionCondition/index.md)

Defined in: [core/src/types/manifest.ts:113](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/manifest.ts#L113)

Condition that triggers this rule

***

### suggest

> **suggest**: [`SuggestionAction`](https://getpromptscript.dev/api-reference/core/src/interfaces/SuggestionAction/index.md)

Defined in: [core/src/types/manifest.ts:115](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/manifest.ts#L115)

What to suggest when condition matches