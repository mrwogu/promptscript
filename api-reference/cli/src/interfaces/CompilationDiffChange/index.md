# CompilationDiffChange

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CompilationDiffChange

Defined in: [cli/src/utils/diff-report.ts:38](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/cli/src/utils/diff-report.ts#L38)

## Properties

### content?

> `optional` **content?**: `string`

Defined in: [cli/src/utils/diff-report.ts:46](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/cli/src/utils/diff-report.ts#L46)

***

### contentHash?

> `optional` **contentHash?**: `string`

Defined in: [cli/src/utils/diff-report.ts:45](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/cli/src/utils/diff-report.ts#L45)

***

### kind

> **kind**: [`DiffChangeKind`](https://getpromptscript.dev/api-reference/cli/src/type-aliases/DiffChangeKind/index.md)

Defined in: [cli/src/utils/diff-report.ts:42](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/cli/src/utils/diff-report.ts#L42)

***

### location?

> `optional` **location?**: [`DiffLocation`](https://getpromptscript.dev/api-reference/cli/src/interfaces/DiffLocation/index.md)

Defined in: [cli/src/utils/diff-report.ts:48](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/cli/src/utils/diff-report.ts#L48)

***

### mode?

> `optional` **mode?**: `number`

Defined in: [cli/src/utils/diff-report.ts:44](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/cli/src/utils/diff-report.ts#L44)

***

### ownership

> **ownership**: [`DiffOwnership`](https://getpromptscript.dev/api-reference/cli/src/type-aliases/DiffOwnership/index.md)

Defined in: [cli/src/utils/diff-report.ts:43](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/cli/src/utils/diff-report.ts#L43)

***

### path

> **path**: `string`

Defined in: [cli/src/utils/diff-report.ts:40](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/cli/src/utils/diff-report.ts#L40)

***

### source

> **source**: `string`

Defined in: [cli/src/utils/diff-report.ts:41](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/cli/src/utils/diff-report.ts#L41)

***

### target

> **target**: `string`

Defined in: [cli/src/utils/diff-report.ts:39](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/cli/src/utils/diff-report.ts#L39)

***

### warnings?

> `optional` **warnings?**: [`DiffWarning`](https://getpromptscript.dev/api-reference/cli/src/interfaces/DiffWarning/index.md)[]

Defined in: [cli/src/utils/diff-report.ts:47](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/cli/src/utils/diff-report.ts#L47)