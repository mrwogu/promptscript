# CompileError

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CompileError

Defined in: [compiler/src/types.ts:195](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L195)

Compilation error with additional metadata.

## Properties

### agentName?

> `optional` **agentName?**: `string`

Defined in: [compiler/src/types.ts:213](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L213)

First agent name included in the diagnostic

***

### code

> **code**: `string`

Defined in: [compiler/src/types.ts:199](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L199)

Error code or rule ID

***

### conflicts?

> `optional` **conflicts?**: [`AgentConflict`](https://getpromptscript.dev/api-reference/core/src/interfaces/AgentConflict/index.md)[]

Defined in: [compiler/src/types.ts:211](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L211)

All agent conflicts included in the diagnostic

***

### format?

> `optional` **format?**: () => `string`

Defined in: [compiler/src/types.ts:215](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L215)

Format error for display

#### Returns

`string`

***

### location?

> `optional` **location?**: `object`

Defined in: [compiler/src/types.ts:203](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L203)

Source location

#### column?

> `optional` **column?**: `number`

#### file?

> `optional` **file?**: `string`

#### line?

> `optional` **line?**: `number`

***

### message

> **message**: `string`

Defined in: [compiler/src/types.ts:201](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L201)

Error message

***

### name

> **name**: `string`

Defined in: [compiler/src/types.ts:197](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L197)

Error name/type

***

### provenance?

> `optional` **provenance?**: [`AgentProvenance`](https://getpromptscript.dev/api-reference/core/src/interfaces/AgentProvenance/index.md)[]

Defined in: [compiler/src/types.ts:209](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L209)

Agent provenance when resolution reports a name conflict