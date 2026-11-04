# CompileError

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CompileError

Defined in: [compiler/src/types.ts:215](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L215)

Compilation error with additional metadata.

## Properties

### agentName?

> `optional` **agentName?**: `string`

Defined in: [compiler/src/types.ts:235](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L235)

First agent name included in the diagnostic

***

### causeCode?

> `optional` **causeCode?**: `string`

Defined in: [compiler/src/types.ts:223](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L223)

Code of the underlying error, such as the parser code behind a resolve error

***

### code

> **code**: `string`

Defined in: [compiler/src/types.ts:219](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L219)

Error code or rule ID

***

### conflicts?

> `optional` **conflicts?**: [`AgentConflict`](https://getpromptscript.dev/api-reference/core/src/interfaces/AgentConflict/index.md)[]

Defined in: [compiler/src/types.ts:233](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L233)

All agent conflicts included in the diagnostic

***

### format?

> `optional` **format?**: () => `string`

Defined in: [compiler/src/types.ts:237](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L237)

Format error for display

#### Returns

`string`

***

### location?

> `optional` **location?**: `object`

Defined in: [compiler/src/types.ts:225](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L225)

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

Defined in: [compiler/src/types.ts:221](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L221)

Error message

***

### name

> **name**: `string`

Defined in: [compiler/src/types.ts:217](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L217)

Error name/type

***

### provenance?

> `optional` **provenance?**: [`AgentProvenance`](https://getpromptscript.dev/api-reference/core/src/interfaces/AgentProvenance/index.md)[]

Defined in: [compiler/src/types.ts:231](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L231)

Agent provenance when resolution reports a name conflict