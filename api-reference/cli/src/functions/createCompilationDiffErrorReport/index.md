# createCompilationDiffErrorReport()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createCompilationDiffErrorReport()

> **createCompilationDiffErrorReport**(`errors`, `warnings`, `projectRoot`, `includeContent?`): [`CompilationDiffReport`](https://getpromptscript.dev/api-reference/cli/src/interfaces/CompilationDiffReport/index.md)

Defined in: [cli/src/utils/diff-report.ts:396](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/cli/src/utils/diff-report.ts#L396)

## Parameters

### errors

[`CompileError`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CompileError/index.md)[]

### warnings

[`ValidationMessage`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationMessage/index.md)[]

### projectRoot

`string`

### includeContent?

`boolean` = `false`

## Returns

[`CompilationDiffReport`](https://getpromptscript.dev/api-reference/cli/src/interfaces/CompilationDiffReport/index.md)