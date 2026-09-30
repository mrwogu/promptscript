# CompilationDiffChange

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CompilationDiffChange

Defined in: [cli/src/utils/diff-report.ts:37](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/utils/diff-report.ts#L37)

## Properties

### content?

> `optional` **content?**: `string`

Defined in: [cli/src/utils/diff-report.ts:45](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/utils/diff-report.ts#L45)

***

### contentHash?

> `optional` **contentHash?**: `string`

Defined in: [cli/src/utils/diff-report.ts:44](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/utils/diff-report.ts#L44)

***

### kind

> **kind**: [`DiffChangeKind`](https://getpromptscript.dev/api-reference/cli/src/type-aliases/DiffChangeKind/index.md)

Defined in: [cli/src/utils/diff-report.ts:41](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/utils/diff-report.ts#L41)

***

### location?

> `optional` **location?**: [`DiffLocation`](https://getpromptscript.dev/api-reference/cli/src/interfaces/DiffLocation/index.md)

Defined in: [cli/src/utils/diff-report.ts:47](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/utils/diff-report.ts#L47)

***

### mode?

> `optional` **mode?**: `number`

Defined in: [cli/src/utils/diff-report.ts:43](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/utils/diff-report.ts#L43)

***

### ownership

> **ownership**: [`DiffOwnership`](https://getpromptscript.dev/api-reference/cli/src/type-aliases/DiffOwnership/index.md)

Defined in: [cli/src/utils/diff-report.ts:42](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/utils/diff-report.ts#L42)

***

### path

> **path**: `string`

Defined in: [cli/src/utils/diff-report.ts:39](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/utils/diff-report.ts#L39)

***

### source

> **source**: `string`

Defined in: [cli/src/utils/diff-report.ts:40](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/utils/diff-report.ts#L40)

***

### target

> **target**: `string`

Defined in: [cli/src/utils/diff-report.ts:38](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/utils/diff-report.ts#L38)

***

### warnings?

> `optional` **warnings?**: [`DiffWarning`](https://getpromptscript.dev/api-reference/cli/src/interfaces/DiffWarning/index.md)[]

Defined in: [cli/src/utils/diff-report.ts:46](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/utils/diff-report.ts#L46)