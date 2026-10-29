# PromptExtractionIssue

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptExtractionIssue

Defined in: [core/src/prompt-definitions.ts:20](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/prompt-definitions.ts#L20)

One problem found while reading a `@prompts` entry.

## Properties

### loc

> **loc**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/prompt-definitions.ts:28](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/prompt-definitions.ts#L28)

Location of the entry

***

### message

> **message**: `string`

Defined in: [core/src/prompt-definitions.ts:24](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/prompt-definitions.ts#L24)

Actionable message that names the entry

***

### prompt

> **prompt**: `string`

Defined in: [core/src/prompt-definitions.ts:22](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/prompt-definitions.ts#L22)

Entry key as authored

***

### suggestion

> **suggestion**: `string`

Defined in: [core/src/prompt-definitions.ts:26](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/prompt-definitions.ts#L26)

How to fix it