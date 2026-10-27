# BuildCompilationDiffOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: BuildCompilationDiffOptions

Defined in: [cli/src/utils/diff-report.ts:79](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/cli/src/utils/diff-report.ts#L79)

## Properties

### entryPath

> **entryPath**: `string`

Defined in: [cli/src/utils/diff-report.ts:82](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/cli/src/utils/diff-report.ts#L82)

***

### includeContent?

> `optional` **includeContent?**: `boolean`

Defined in: [cli/src/utils/diff-report.ts:85](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/cli/src/utils/diff-report.ts#L85)

***

### omittedDirectories?

> `optional` **omittedDirectories?**: readonly [`OmittedManagedDirectory`](https://getpromptscript.dev/api-reference/core/src/interfaces/OmittedManagedDirectory/index.md)[]

Defined in: [cli/src/utils/diff-report.ts:87](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/cli/src/utils/diff-report.ts#L87)

Directories of omitted outputs, from the compiler plan, so removed files are reported

***

### outputRoot

> **outputRoot**: `string`

Defined in: [cli/src/utils/diff-report.ts:81](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/cli/src/utils/diff-report.ts#L81)

***

### outputs

> **outputs**: `Map`\<`string`, [`FormatterOutput`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/FormatterOutput/index.md)\>

Defined in: [cli/src/utils/diff-report.ts:83](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/cli/src/utils/diff-report.ts#L83)

***

### projectRoot

> **projectRoot**: `string`

Defined in: [cli/src/utils/diff-report.ts:80](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/cli/src/utils/diff-report.ts#L80)

***

### warnings

> **warnings**: [`ValidationMessage`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationMessage/index.md)[]

Defined in: [cli/src/utils/diff-report.ts:84](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/cli/src/utils/diff-report.ts#L84)