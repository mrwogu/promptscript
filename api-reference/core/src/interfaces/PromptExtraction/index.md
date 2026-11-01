# PromptExtraction

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptExtraction

Defined in: [core/src/prompt-definitions.ts:32](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/prompt-definitions.ts#L32)

Result of reading every `@prompts` entry of a program.

## Properties

### issues

> **issues**: [`PromptExtractionIssue`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptExtractionIssue/index.md)[]

Defined in: [core/src/prompt-definitions.ts:36](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/prompt-definitions.ts#L36)

Everything wrong with the entries

***

### prompts

> **prompts**: [`PromptDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptDefinition/index.md)[]

Defined in: [core/src/prompt-definitions.ts:34](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/prompt-definitions.ts#L34)

Entries with a usable key. Invalid parts are left out, see `issues`.