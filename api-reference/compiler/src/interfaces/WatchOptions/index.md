# WatchOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: WatchOptions

Defined in: [compiler/src/types.ts:252](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L252)

Options for watch mode.

## Properties

### debounce?

> `optional` **debounce?**: `number`

Defined in: [compiler/src/types.ts:258](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L258)

Debounce delay in milliseconds. Defaults to 300.

***

### exclude?

> `optional` **exclude?**: `string`[]

Defined in: [compiler/src/types.ts:256](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L256)

Glob patterns to exclude. Defaults to node_modules.

***

### include?

> `optional` **include?**: `string`[]

Defined in: [compiler/src/types.ts:254](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L254)

Glob patterns for primary files. Resolved dependencies are watched automatically.

***

### onCompile?

> `optional` **onCompile?**: [`WatchCallback`](https://getpromptscript.dev/api-reference/compiler/src/type-aliases/WatchCallback/index.md)

Defined in: [compiler/src/types.ts:260](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L260)

Callback invoked on each recompilation

***

### onError?

> `optional` **onError?**: (`error`) => `void`

Defined in: [compiler/src/types.ts:262](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/compiler/src/types.ts#L262)

Callback invoked on errors

#### Parameters

##### error

`Error`

#### Returns

`void`