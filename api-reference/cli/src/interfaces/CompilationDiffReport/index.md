# CompilationDiffReport

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CompilationDiffReport

Defined in: [cli/src/utils/diff-report.ts:71](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/cli/src/utils/diff-report.ts#L71)

## Properties

### $schema

> **$schema**: `"https://getpromptscript.dev/schema/diff/v1.json"`

Defined in: [cli/src/utils/diff-report.ts:72](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/cli/src/utils/diff-report.ts#L72)

***

### changes

> **changes**: [`CompilationDiffChange`](https://getpromptscript.dev/api-reference/cli/src/interfaces/CompilationDiffChange/index.md)[]

Defined in: [cli/src/utils/diff-report.ts:77](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/cli/src/utils/diff-report.ts#L77)

***

### contentIncluded

> **contentIncluded**: `boolean`

Defined in: [cli/src/utils/diff-report.ts:74](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/cli/src/utils/diff-report.ts#L74)

***

### errors

> **errors**: `object`[]

Defined in: [cli/src/utils/diff-report.ts:80](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/cli/src/utils/diff-report.ts#L80)

#### code?

> `optional` **code?**: `string`

#### location?

> `optional` **location?**: [`DiffLocation`](https://getpromptscript.dev/api-reference/cli/src/interfaces/DiffLocation/index.md)

#### message

> **message**: `string`

#### name?

> `optional` **name?**: `string`

***

### hasChanges

> **hasChanges**: `boolean`

Defined in: [cli/src/utils/diff-report.ts:76](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/cli/src/utils/diff-report.ts#L76)

***

### success

> **success**: `boolean`

Defined in: [cli/src/utils/diff-report.ts:75](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/cli/src/utils/diff-report.ts#L75)

***

### summary

> **summary**: [`CompilationDiffSummary`](https://getpromptscript.dev/api-reference/cli/src/interfaces/CompilationDiffSummary/index.md)

Defined in: [cli/src/utils/diff-report.ts:86](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/cli/src/utils/diff-report.ts#L86)

***

### unsupported

> **unsupported**: [`CompilationDiffChange`](https://getpromptscript.dev/api-reference/cli/src/interfaces/CompilationDiffChange/index.md)[]

Defined in: [cli/src/utils/diff-report.ts:78](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/cli/src/utils/diff-report.ts#L78)

***

### version

> **version**: `1`

Defined in: [cli/src/utils/diff-report.ts:73](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/cli/src/utils/diff-report.ts#L73)

***

### warnings

> **warnings**: [`DiffWarning`](https://getpromptscript.dev/api-reference/cli/src/interfaces/DiffWarning/index.md)[]

Defined in: [cli/src/utils/diff-report.ts:79](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/cli/src/utils/diff-report.ts#L79)