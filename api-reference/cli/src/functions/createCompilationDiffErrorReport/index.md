# createCompilationDiffErrorReport()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createCompilationDiffErrorReport()

> **createCompilationDiffErrorReport**(`errors`, `warnings`, `projectRoot`, `includeContent?`): [`CompilationDiffReport`](https://getpromptscript.dev/api-reference/cli/src/interfaces/CompilationDiffReport/index.md)

Defined in: [cli/src/utils/diff-report.ts:396](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/cli/src/utils/diff-report.ts#L396)

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