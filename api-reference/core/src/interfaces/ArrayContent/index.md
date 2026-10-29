# ArrayContent

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ArrayContent

Defined in: [core/src/types/ast.ts:430](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/ast.ts#L430)

Array/list content.

## Extends

- [`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md)

## Properties

### elements

> **elements**: [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)[]

Defined in: [core/src/types/ast.ts:433](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/ast.ts#L433)

Array elements

***

### loc

> **loc**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/types/ast.ts:16](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/ast.ts#L16)

Source location

#### Inherited from

[`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md).[`loc`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md#loc)

***

### type

> `readonly` **type**: `"ArrayContent"`

Defined in: [core/src/types/ast.ts:431](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/ast.ts#L431)

Node type discriminator

#### Overrides

[`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md).[`type`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md#type)