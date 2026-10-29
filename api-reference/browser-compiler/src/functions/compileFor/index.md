# compileFor()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: compileFor()

> **compileFor**(`files`, `entryPath`, `formatter`): `Promise`\<[`CompileResult`](https://getpromptscript.dev/api-reference/browser-compiler/src/interfaces/CompileResult/index.md)\>

Defined in: [browser-compiler/src/index.ts:198](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/browser-compiler/src/index.ts#L198)

Compile PromptScript files for a specific formatter.

Convenience function when you only need output for one formatter.

## Parameters

### files

`Map`\<`string`, `string`\> \| `Record`\<`string`, `string`\>

Map of file paths to contents

### entryPath

`string`

Path to the entry file

### formatter

`string`

Formatter name (e.g., 'claude', 'github', 'cursor')

## Returns

`Promise`\<[`CompileResult`](https://getpromptscript.dev/api-reference/browser-compiler/src/interfaces/CompileResult/index.md)\>

Compilation result with output for the specified formatter