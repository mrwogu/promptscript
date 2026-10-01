# CompilationDiffReport

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CompilationDiffReport

Defined in: [cli/src/utils/diff-report.ts:60](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/utils/diff-report.ts#L60)

## Properties

### $schema

> **$schema**: `"https://getpromptscript.dev/schema/diff/v1.json"`

Defined in: [cli/src/utils/diff-report.ts:61](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/utils/diff-report.ts#L61)

***

### changes

> **changes**: [`CompilationDiffChange`](https://getpromptscript.dev/api-reference/cli/src/interfaces/CompilationDiffChange/index.md)[]

Defined in: [cli/src/utils/diff-report.ts:66](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/utils/diff-report.ts#L66)

***

### contentIncluded

> **contentIncluded**: `boolean`

Defined in: [cli/src/utils/diff-report.ts:63](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/utils/diff-report.ts#L63)

***

### errors

> **errors**: `object`[]

Defined in: [cli/src/utils/diff-report.ts:69](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/utils/diff-report.ts#L69)

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

Defined in: [cli/src/utils/diff-report.ts:65](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/utils/diff-report.ts#L65)

***

### success

> **success**: `boolean`

Defined in: [cli/src/utils/diff-report.ts:64](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/utils/diff-report.ts#L64)

***

### summary

> **summary**: [`CompilationDiffSummary`](https://getpromptscript.dev/api-reference/cli/src/interfaces/CompilationDiffSummary/index.md)

Defined in: [cli/src/utils/diff-report.ts:75](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/utils/diff-report.ts#L75)

***

### unsupported

> **unsupported**: [`CompilationDiffChange`](https://getpromptscript.dev/api-reference/cli/src/interfaces/CompilationDiffChange/index.md)[]

Defined in: [cli/src/utils/diff-report.ts:67](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/utils/diff-report.ts#L67)

***

### version

> **version**: `1`

Defined in: [cli/src/utils/diff-report.ts:62](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/utils/diff-report.ts#L62)

***

### warnings

> **warnings**: [`DiffWarning`](https://getpromptscript.dev/api-reference/cli/src/interfaces/DiffWarning/index.md)[]

Defined in: [cli/src/utils/diff-report.ts:68](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/utils/diff-report.ts#L68)