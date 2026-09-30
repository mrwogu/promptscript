# SuggestionRule

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: SuggestionRule

Defined in: [core/src/types/manifest.ts:117](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/manifest.ts#L117)

A rule for suggesting configurations.

## Properties

### condition

> **condition**: [`SuggestionCondition`](https://getpromptscript.dev/api-reference/core/src/interfaces/SuggestionCondition/index.md)

Defined in: [core/src/types/manifest.ts:119](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/manifest.ts#L119)

Condition that triggers this rule

***

### suggest

> **suggest**: [`SuggestionAction`](https://getpromptscript.dev/api-reference/core/src/interfaces/SuggestionAction/index.md)

Defined in: [core/src/types/manifest.ts:121](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/manifest.ts#L121)

What to suggest when condition matches