# CompileResult

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CompileResult

Defined in: [compiler/src/types.ts:257](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/compiler/src/types.ts#L257)

Result of a compilation.

## Properties

### composition?

> `optional` **composition?**: [`PromptComposition`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptComposition/index.md)[]

Defined in: [compiler/src/types.ts:275](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/compiler/src/types.ts#L275)

Blocks each prompt composed into its system message, when a prompt target ran

***

### errors

> **errors**: [`CompileError`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CompileError/index.md)[]

Defined in: [compiler/src/types.ts:269](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/compiler/src/types.ts#L269)

Errors encountered during compilation

***

### outputPlan?

> `optional` **outputPlan?**: [`OutputPlan`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputPlan/index.md)

Defined in: [compiler/src/types.ts:267](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/compiler/src/types.ts#L267)

Shared filesystem-independent output plan.

Optional for compatibility with manually constructed compile results.

***

### outputs

> **outputs**: `Map`\<`string`, [`FormatterOutput`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/FormatterOutput/index.md)\>

Defined in: [compiler/src/types.ts:261](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/compiler/src/types.ts#L261)

Formatter outputs keyed by normalized output path

***

### stats

> **stats**: [`CompileStats`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CompileStats/index.md)

Defined in: [compiler/src/types.ts:273](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/compiler/src/types.ts#L273)

Compilation statistics

***

### success

> **success**: `boolean`

Defined in: [compiler/src/types.ts:259](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/compiler/src/types.ts#L259)

Whether compilation succeeded

***

### warnings

> **warnings**: [`ValidationMessage`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationMessage/index.md)[]

Defined in: [compiler/src/types.ts:271](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/compiler/src/types.ts#L271)

Warnings from validation