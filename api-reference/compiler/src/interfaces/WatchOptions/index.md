# WatchOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: WatchOptions

Defined in: [compiler/src/types.ts:264](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/compiler/src/types.ts#L264)

Options for watch mode.

## Properties

### debounce?

> `optional` **debounce?**: `number`

Defined in: [compiler/src/types.ts:270](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/compiler/src/types.ts#L270)

Debounce delay in milliseconds. Defaults to 300.

***

### exclude?

> `optional` **exclude?**: `string`[]

Defined in: [compiler/src/types.ts:268](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/compiler/src/types.ts#L268)

Glob patterns to exclude. Defaults to node_modules.

***

### include?

> `optional` **include?**: `string`[]

Defined in: [compiler/src/types.ts:266](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/compiler/src/types.ts#L266)

Glob patterns for primary files. Resolved dependencies are watched automatically.

***

### onCompile?

> `optional` **onCompile?**: [`WatchCallback`](https://getpromptscript.dev/api-reference/compiler/src/type-aliases/WatchCallback/index.md)

Defined in: [compiler/src/types.ts:272](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/compiler/src/types.ts#L272)

Callback invoked on each recompilation

***

### onError?

> `optional` **onError?**: (`error`) => `void`

Defined in: [compiler/src/types.ts:274](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/compiler/src/types.ts#L274)

Callback invoked on errors

#### Parameters

##### error

`Error`

#### Returns

`void`