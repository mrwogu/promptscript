# SuggestionRule

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: SuggestionRule

Defined in: [core/src/types/manifest.ts:117](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/core/src/types/manifest.ts#L117)

A rule for suggesting configurations.

## Properties

### condition

> **condition**: [`SuggestionCondition`](https://getpromptscript.dev/api-reference/core/src/interfaces/SuggestionCondition/index.md)

Defined in: [core/src/types/manifest.ts:119](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/core/src/types/manifest.ts#L119)

Condition that triggers this rule

***

### suggest

> **suggest**: [`SuggestionAction`](https://getpromptscript.dev/api-reference/core/src/interfaces/SuggestionAction/index.md)

Defined in: [core/src/types/manifest.ts:121](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/core/src/types/manifest.ts#L121)

What to suggest when condition matches