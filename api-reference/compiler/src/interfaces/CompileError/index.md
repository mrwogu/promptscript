# CompileError

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CompileError

Defined in: [compiler/src/types.ts:197](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/compiler/src/types.ts#L197)

Compilation error with additional metadata.

## Properties

### agentName?

> `optional` **agentName?**: `string`

Defined in: [compiler/src/types.ts:215](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/compiler/src/types.ts#L215)

First agent name included in the diagnostic

***

### code

> **code**: `string`

Defined in: [compiler/src/types.ts:201](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/compiler/src/types.ts#L201)

Error code or rule ID

***

### conflicts?

> `optional` **conflicts?**: [`AgentConflict`](https://getpromptscript.dev/api-reference/core/src/interfaces/AgentConflict/index.md)[]

Defined in: [compiler/src/types.ts:213](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/compiler/src/types.ts#L213)

All agent conflicts included in the diagnostic

***

### format?

> `optional` **format?**: () => `string`

Defined in: [compiler/src/types.ts:217](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/compiler/src/types.ts#L217)

Format error for display

#### Returns

`string`

***

### location?

> `optional` **location?**: `object`

Defined in: [compiler/src/types.ts:205](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/compiler/src/types.ts#L205)

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

Defined in: [compiler/src/types.ts:203](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/compiler/src/types.ts#L203)

Error message

***

### name

> **name**: `string`

Defined in: [compiler/src/types.ts:199](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/compiler/src/types.ts#L199)

Error name/type

***

### provenance?

> `optional` **provenance?**: [`AgentProvenance`](https://getpromptscript.dev/api-reference/core/src/interfaces/AgentProvenance/index.md)[]

Defined in: [compiler/src/types.ts:211](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/compiler/src/types.ts#L211)

Agent provenance when resolution reports a name conflict