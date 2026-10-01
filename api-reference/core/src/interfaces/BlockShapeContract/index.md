# BlockShapeContract

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: BlockShapeContract

Defined in: [core/src/block-shapes.ts:13](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/block-shapes.ts#L13)

Shape contract for one built-in block.

## Properties

### canonicalShape

> `readonly` **canonicalShape**: `"object"` \| `"array"` \| `"text"` \| `"mixed"`

Defined in: [core/src/block-shapes.ts:15](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/block-shapes.ts#L15)

Preferred shape for new files and examples

***

### example

> `readonly` **example**: `string`

Defined in: [core/src/block-shapes.ts:21](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/block-shapes.ts#L21)

Minimal canonical replacement used by diagnostics

***

### legacyShapes

> `readonly` **legacyShapes**: readonly (`"object"` \| `"array"` \| `"text"` \| `"mixed"`)[]

Defined in: [core/src/block-shapes.ts:19](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/block-shapes.ts#L19)

Supported shapes that may be formatter-sensitive

***

### supportedShapes

> `readonly` **supportedShapes**: readonly (`"object"` \| `"array"` \| `"text"` \| `"mixed"`)[]

Defined in: [core/src/block-shapes.ts:17](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/block-shapes.ts#L17)

Shapes that retain defined behavior