# BlockReplacement

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: BlockReplacement

Defined in: [core/src/types/ast.ts:356](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/ast.ts#L356)

Complete replacement for a block body.

## Extends

- [`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md)

## Properties

### body

> **body**: [`BlockBody`](https://getpromptscript.dev/api-reference/core/src/interfaces/BlockBody/index.md)

Defined in: [core/src/types/ast.ts:358](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/ast.ts#L358)

***

### loc

> **loc**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/types/ast.ts:16](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/ast.ts#L16)

Source location

#### Inherited from

[`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md).[`loc`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md#loc)

***

### type

> `readonly` **type**: `"BlockReplacement"`

Defined in: [core/src/types/ast.ts:357](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/ast.ts#L357)

Node type discriminator

#### Overrides

[`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md).[`type`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md#type)