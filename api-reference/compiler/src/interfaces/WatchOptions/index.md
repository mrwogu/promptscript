# WatchOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: WatchOptions

Defined in: [compiler/src/types.ts:286](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/compiler/src/types.ts#L286)

Options for watch mode.

## Properties

### debounce?

> `optional` **debounce?**: `number`

Defined in: [compiler/src/types.ts:292](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/compiler/src/types.ts#L292)

Debounce delay in milliseconds. Defaults to 300.

***

### exclude?

> `optional` **exclude?**: `string`[]

Defined in: [compiler/src/types.ts:290](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/compiler/src/types.ts#L290)

Glob patterns to exclude. Defaults to node_modules.

***

### include?

> `optional` **include?**: `string`[]

Defined in: [compiler/src/types.ts:288](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/compiler/src/types.ts#L288)

Glob patterns for primary files. Resolved dependencies are watched automatically.

***

### onCompile?

> `optional` **onCompile?**: [`WatchCallback`](https://getpromptscript.dev/api-reference/compiler/src/type-aliases/WatchCallback/index.md)

Defined in: [compiler/src/types.ts:294](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/compiler/src/types.ts#L294)

Callback invoked on each recompilation

***

### onError?

> `optional` **onError?**: (`error`) => `void`

Defined in: [compiler/src/types.ts:296](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/compiler/src/types.ts#L296)

Callback invoked on errors

#### Parameters

##### error

`Error`

#### Returns

`void`