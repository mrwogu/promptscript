# CompileError

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CompileError

Defined in: [browser-compiler/src/compiler.ts:90](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/browser-compiler/src/compiler.ts#L90)

Compilation error with additional metadata.

## Properties

### code

> **code**: `string`

Defined in: [browser-compiler/src/compiler.ts:94](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/browser-compiler/src/compiler.ts#L94)

Error code or rule ID

***

### location?

> `optional` **location?**: `object`

Defined in: [browser-compiler/src/compiler.ts:98](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/browser-compiler/src/compiler.ts#L98)

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

Defined in: [browser-compiler/src/compiler.ts:96](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/browser-compiler/src/compiler.ts#L96)

Error message

***

### name

> **name**: `string`

Defined in: [browser-compiler/src/compiler.ts:92](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/browser-compiler/src/compiler.ts#L92)

Error name/type