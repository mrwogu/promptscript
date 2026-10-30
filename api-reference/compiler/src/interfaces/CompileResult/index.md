# CompileResult

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CompileResult

Defined in: [compiler/src/types.ts:235](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/compiler/src/types.ts#L235)

Result of a compilation.

## Properties

### composition?

> `optional` **composition?**: [`PromptComposition`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptComposition/index.md)[]

Defined in: [compiler/src/types.ts:253](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/compiler/src/types.ts#L253)

Blocks each prompt composed into its system message, when a prompt target ran

***

### errors

> **errors**: [`CompileError`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CompileError/index.md)[]

Defined in: [compiler/src/types.ts:247](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/compiler/src/types.ts#L247)

Errors encountered during compilation

***

### outputPlan?

> `optional` **outputPlan?**: [`OutputPlan`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputPlan/index.md)

Defined in: [compiler/src/types.ts:245](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/compiler/src/types.ts#L245)

Shared filesystem-independent output plan.

Optional for compatibility with manually constructed compile results.

***

### outputs

> **outputs**: `Map`\<`string`, [`FormatterOutput`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/FormatterOutput/index.md)\>

Defined in: [compiler/src/types.ts:239](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/compiler/src/types.ts#L239)

Formatter outputs keyed by normalized output path

***

### stats

> **stats**: [`CompileStats`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CompileStats/index.md)

Defined in: [compiler/src/types.ts:251](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/compiler/src/types.ts#L251)

Compilation statistics

***

### success

> **success**: `boolean`

Defined in: [compiler/src/types.ts:237](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/compiler/src/types.ts#L237)

Whether compilation succeeded

***

### warnings

> **warnings**: [`ValidationMessage`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationMessage/index.md)[]

Defined in: [compiler/src/types.ts:249](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/compiler/src/types.ts#L249)

Warnings from validation