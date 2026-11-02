# BuildCompilationDiffOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: BuildCompilationDiffOptions

Defined in: [cli/src/utils/diff-report.ts:89](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/cli/src/utils/diff-report.ts#L89)

## Properties

### entryPath

> **entryPath**: `string`

Defined in: [cli/src/utils/diff-report.ts:92](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/cli/src/utils/diff-report.ts#L92)

***

### includeContent?

> `optional` **includeContent?**: `boolean`

Defined in: [cli/src/utils/diff-report.ts:95](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/cli/src/utils/diff-report.ts#L95)

***

### omittedDirectories?

> `optional` **omittedDirectories?**: readonly [`OmittedManagedDirectory`](https://getpromptscript.dev/api-reference/core/src/interfaces/OmittedManagedDirectory/index.md)[]

Defined in: [cli/src/utils/diff-report.ts:97](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/cli/src/utils/diff-report.ts#L97)

Directories of omitted outputs, from the compiler plan, so removed files are reported

***

### outputRoot

> **outputRoot**: `string`

Defined in: [cli/src/utils/diff-report.ts:91](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/cli/src/utils/diff-report.ts#L91)

***

### outputs

> **outputs**: `Map`\<`string`, [`FormatterOutput`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/FormatterOutput/index.md)\>

Defined in: [cli/src/utils/diff-report.ts:93](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/cli/src/utils/diff-report.ts#L93)

***

### projectRoot

> **projectRoot**: `string`

Defined in: [cli/src/utils/diff-report.ts:90](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/cli/src/utils/diff-report.ts#L90)

***

### warnings

> **warnings**: [`ValidationMessage`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationMessage/index.md)[]

Defined in: [cli/src/utils/diff-report.ts:94](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/cli/src/utils/diff-report.ts#L94)