# CompilationDiffChange

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CompilationDiffChange

Defined in: [cli/src/utils/diff-report.ts:48](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/utils/diff-report.ts#L48)

## Properties

### content?

> `optional` **content?**: `string`

Defined in: [cli/src/utils/diff-report.ts:56](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/utils/diff-report.ts#L56)

***

### contentHash?

> `optional` **contentHash?**: `string`

Defined in: [cli/src/utils/diff-report.ts:55](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/utils/diff-report.ts#L55)

***

### kind

> **kind**: [`DiffChangeKind`](https://getpromptscript.dev/api-reference/cli/src/type-aliases/DiffChangeKind/index.md)

Defined in: [cli/src/utils/diff-report.ts:52](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/utils/diff-report.ts#L52)

***

### location?

> `optional` **location?**: [`DiffLocation`](https://getpromptscript.dev/api-reference/cli/src/interfaces/DiffLocation/index.md)

Defined in: [cli/src/utils/diff-report.ts:58](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/utils/diff-report.ts#L58)

***

### mode?

> `optional` **mode?**: `number`

Defined in: [cli/src/utils/diff-report.ts:54](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/utils/diff-report.ts#L54)

***

### ownership

> **ownership**: [`DiffOwnership`](https://getpromptscript.dev/api-reference/cli/src/type-aliases/DiffOwnership/index.md)

Defined in: [cli/src/utils/diff-report.ts:53](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/utils/diff-report.ts#L53)

***

### path

> **path**: `string`

Defined in: [cli/src/utils/diff-report.ts:50](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/utils/diff-report.ts#L50)

***

### source

> **source**: `string`

Defined in: [cli/src/utils/diff-report.ts:51](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/utils/diff-report.ts#L51)

***

### target

> **target**: `string`

Defined in: [cli/src/utils/diff-report.ts:49](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/utils/diff-report.ts#L49)

***

### warnings?

> `optional` **warnings?**: [`DiffWarning`](https://getpromptscript.dev/api-reference/cli/src/interfaces/DiffWarning/index.md)[]

Defined in: [cli/src/utils/diff-report.ts:57](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/utils/diff-report.ts#L57)