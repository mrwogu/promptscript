# CompileResult

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CompileResult

Defined in: [browser-compiler/src/compiler.ts:127](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/browser-compiler/src/compiler.ts#L127)

Result of a compilation.

## Properties

### errors

> **errors**: [`CompileError`](https://getpromptscript.dev/api-reference/browser-compiler/src/interfaces/CompileError/index.md)[]

Defined in: [browser-compiler/src/compiler.ts:139](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/browser-compiler/src/compiler.ts#L139)

Errors encountered during compilation

***

### outputOwners?

> `optional` **outputOwners?**: `Map`\<`string`, `string`\>

Defined in: [browser-compiler/src/compiler.ts:135](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/browser-compiler/src/compiler.ts#L135)

Maps each output path to the formatter name that produced it.
 Present on results from BrowserCompiler.compile(); may be absent in
 manually constructed results.

***

### outputPlan?

> `optional` **outputPlan?**: [`OutputPlan`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputPlan/index.md)

Defined in: [browser-compiler/src/compiler.ts:137](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/browser-compiler/src/compiler.ts#L137)

Shared filesystem-independent output plan.

***

### outputs

> **outputs**: `Map`\<`string`, [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)\>

Defined in: [browser-compiler/src/compiler.ts:131](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/browser-compiler/src/compiler.ts#L131)

Formatter outputs keyed by normalized output path

***

### stats

> **stats**: [`CompileStats`](https://getpromptscript.dev/api-reference/browser-compiler/src/interfaces/CompileStats/index.md)

Defined in: [browser-compiler/src/compiler.ts:143](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/browser-compiler/src/compiler.ts#L143)

Compilation statistics

***

### success

> **success**: `boolean`

Defined in: [browser-compiler/src/compiler.ts:129](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/browser-compiler/src/compiler.ts#L129)

Whether compilation succeeded

***

### warnings

> **warnings**: [`ValidationMessage`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationMessage/index.md)[]

Defined in: [browser-compiler/src/compiler.ts:141](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/browser-compiler/src/compiler.ts#L141)

Warnings from validation