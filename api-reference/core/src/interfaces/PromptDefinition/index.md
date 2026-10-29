# PromptDefinition

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptDefinition

Defined in: [core/src/types/prompts.ts:95](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/prompts.ts#L95)

Typed view of one

## Prompts

entry. Extraction type, not an AST node.

## Properties

### compose

> **compose**: [`ComposableBlock`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ComposableBlock/index.md)[]

Defined in: [core/src/types/prompts.ts:105](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/prompts.ts#L105)

Blocks composed into the system message

***

### description

> **description**: `string`

Defined in: [core/src/types/prompts.ts:99](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/prompts.ts#L99)

What the prompt does

***

### governance

> **governance**: [`GovernanceMeta`](https://getpromptscript.dev/api-reference/core/src/interfaces/GovernanceMeta/index.md)

Defined in: [core/src/types/prompts.ts:113](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/prompts.ts#L113)

Governance authored on the entry, before

#### Meta

defaults

***

### inputs

> **inputs**: `Record`\<`string`, [`PromptInput`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PromptInput/index.md)\>

Defined in: [core/src/types/prompts.ts:107](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/prompts.ts#L107)

Runtime inputs by name

***

### loc

> **loc**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/types/prompts.ts:115](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/prompts.ts#L115)

Location of the entry

***

### model?

> `optional` **model?**: [`ModelInvocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelInvocation/index.md)

Defined in: [core/src/types/prompts.ts:111](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/prompts.ts#L111)

Model reference and parameters

***

### name

> **name**: `string`

Defined in: [core/src/types/prompts.ts:97](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/prompts.ts#L97)

Entry key

***

### output?

> `optional` **output?**: [`PromptOutputSchema`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptOutputSchema/index.md)

Defined in: [core/src/types/prompts.ts:109](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/prompts.ts#L109)

Output contract

***

### system?

> `optional` **system?**: `string`

Defined in: [core/src/types/prompts.ts:101](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/prompts.ts#L101)

System message text

***

### user?

> `optional` **user?**: `string`

Defined in: [core/src/types/prompts.ts:103](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/prompts.ts#L103)

User message text