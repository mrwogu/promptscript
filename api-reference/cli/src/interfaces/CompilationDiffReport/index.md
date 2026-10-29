# CompilationDiffReport

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CompilationDiffReport

Defined in: [cli/src/utils/diff-report.ts:61](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/utils/diff-report.ts#L61)

## Properties

### $schema

> **$schema**: `"https://getpromptscript.dev/schema/diff/v1.json"`

Defined in: [cli/src/utils/diff-report.ts:62](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/utils/diff-report.ts#L62)

***

### changes

> **changes**: [`CompilationDiffChange`](https://getpromptscript.dev/api-reference/cli/src/interfaces/CompilationDiffChange/index.md)[]

Defined in: [cli/src/utils/diff-report.ts:67](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/utils/diff-report.ts#L67)

***

### contentIncluded

> **contentIncluded**: `boolean`

Defined in: [cli/src/utils/diff-report.ts:64](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/utils/diff-report.ts#L64)

***

### errors

> **errors**: `object`[]

Defined in: [cli/src/utils/diff-report.ts:70](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/utils/diff-report.ts#L70)

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

Defined in: [cli/src/utils/diff-report.ts:66](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/utils/diff-report.ts#L66)

***

### success

> **success**: `boolean`

Defined in: [cli/src/utils/diff-report.ts:65](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/utils/diff-report.ts#L65)

***

### summary

> **summary**: [`CompilationDiffSummary`](https://getpromptscript.dev/api-reference/cli/src/interfaces/CompilationDiffSummary/index.md)

Defined in: [cli/src/utils/diff-report.ts:76](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/utils/diff-report.ts#L76)

***

### unsupported

> **unsupported**: [`CompilationDiffChange`](https://getpromptscript.dev/api-reference/cli/src/interfaces/CompilationDiffChange/index.md)[]

Defined in: [cli/src/utils/diff-report.ts:68](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/utils/diff-report.ts#L68)

***

### version

> **version**: `1`

Defined in: [cli/src/utils/diff-report.ts:63](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/utils/diff-report.ts#L63)

***

### warnings

> **warnings**: [`DiffWarning`](https://getpromptscript.dev/api-reference/cli/src/interfaces/DiffWarning/index.md)[]

Defined in: [cli/src/utils/diff-report.ts:69](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/utils/diff-report.ts#L69)