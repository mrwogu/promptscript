# CompileError

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CompileError

Defined in: [browser-compiler/src/compiler.ts:94](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/browser-compiler/src/compiler.ts#L94)

Compilation error with additional metadata.

## Properties

### code

> **code**: `string`

Defined in: [browser-compiler/src/compiler.ts:98](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/browser-compiler/src/compiler.ts#L98)

Error code or rule ID

***

### location?

> `optional` **location?**: `object`

Defined in: [browser-compiler/src/compiler.ts:102](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/browser-compiler/src/compiler.ts#L102)

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

Defined in: [browser-compiler/src/compiler.ts:100](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/browser-compiler/src/compiler.ts#L100)

Error message

***

### name

> **name**: `string`

Defined in: [browser-compiler/src/compiler.ts:96](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/browser-compiler/src/compiler.ts#L96)

Error name/type