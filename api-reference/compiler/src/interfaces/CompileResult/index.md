# CompileResult

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CompileResult

Defined in: [compiler/src/types.ts:225](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L225)

Result of a compilation.

## Properties

### errors

> **errors**: [`CompileError`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CompileError/index.md)[]

Defined in: [compiler/src/types.ts:237](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L237)

Errors encountered during compilation

***

### outputPlan?

> `optional` **outputPlan?**: [`OutputPlan`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputPlan/index.md)

Defined in: [compiler/src/types.ts:235](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L235)

Shared filesystem-independent output plan.

Optional for compatibility with manually constructed compile results.

***

### outputs

> **outputs**: `Map`\<`string`, [`FormatterOutput`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/FormatterOutput/index.md)\>

Defined in: [compiler/src/types.ts:229](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L229)

Formatter outputs keyed by normalized output path

***

### stats

> **stats**: [`CompileStats`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CompileStats/index.md)

Defined in: [compiler/src/types.ts:241](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L241)

Compilation statistics

***

### success

> **success**: `boolean`

Defined in: [compiler/src/types.ts:227](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L227)

Whether compilation succeeded

***

### warnings

> **warnings**: [`ValidationMessage`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationMessage/index.md)[]

Defined in: [compiler/src/types.ts:239](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L239)

Warnings from validation