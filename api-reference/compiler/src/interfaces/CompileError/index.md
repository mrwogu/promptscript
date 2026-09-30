# CompileError

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CompileError

Defined in: [compiler/src/types.ts:185](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L185)

Compilation error with additional metadata.

## Properties

### agentName?

> `optional` **agentName?**: `string`

Defined in: [compiler/src/types.ts:203](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L203)

First agent name included in the diagnostic

***

### code

> **code**: `string`

Defined in: [compiler/src/types.ts:189](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L189)

Error code or rule ID

***

### conflicts?

> `optional` **conflicts?**: [`AgentConflict`](https://getpromptscript.dev/api-reference/core/src/interfaces/AgentConflict/index.md)[]

Defined in: [compiler/src/types.ts:201](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L201)

All agent conflicts included in the diagnostic

***

### format?

> `optional` **format?**: () => `string`

Defined in: [compiler/src/types.ts:205](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L205)

Format error for display

#### Returns

`string`

***

### location?

> `optional` **location?**: `object`

Defined in: [compiler/src/types.ts:193](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L193)

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

Defined in: [compiler/src/types.ts:191](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L191)

Error message

***

### name

> **name**: `string`

Defined in: [compiler/src/types.ts:187](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L187)

Error name/type

***

### provenance?

> `optional` **provenance?**: [`AgentProvenance`](https://getpromptscript.dev/api-reference/core/src/interfaces/AgentProvenance/index.md)[]

Defined in: [compiler/src/types.ts:199](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L199)

Agent provenance when resolution reports a name conflict