# CompileError

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CompileError

Defined in: [browser-compiler/src/compiler.ts:86](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/compiler.ts#L86)

Compilation error with additional metadata.

## Properties

### code

> **code**: `string`

Defined in: [browser-compiler/src/compiler.ts:90](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/compiler.ts#L90)

Error code or rule ID

***

### location?

> `optional` **location?**: `object`

Defined in: [browser-compiler/src/compiler.ts:94](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/compiler.ts#L94)

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

Defined in: [browser-compiler/src/compiler.ts:92](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/compiler.ts#L92)

Error message

***

### name

> **name**: `string`

Defined in: [browser-compiler/src/compiler.ts:88](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/compiler.ts#L88)

Error name/type