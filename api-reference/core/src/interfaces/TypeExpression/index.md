# TypeExpression

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: TypeExpression

Defined in: [core/src/types/ast.ts:474](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/ast.ts#L474)

Type expression for parameter definitions.

## Extends

- [`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md)

## Properties

### constraints?

> `optional` **constraints?**: `object`

Defined in: [core/src/types/ast.ts:481](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/ast.ts#L481)

Constraints

#### max?

> `optional` **max?**: `number`

#### min?

> `optional` **min?**: `number`

#### options?

> `optional` **options?**: [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)[]

***

### kind

> **kind**: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`

Defined in: [core/src/types/ast.ts:477](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/ast.ts#L477)

Type kind

***

### loc

> **loc**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/types/ast.ts:16](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/ast.ts#L16)

Source location

#### Inherited from

[`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md).[`loc`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md#loc)

***

### params?

> `optional` **params?**: [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)[]

Defined in: [core/src/types/ast.ts:479](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/ast.ts#L479)

Type parameters

***

### type

> `readonly` **type**: `"TypeExpression"`

Defined in: [core/src/types/ast.ts:475](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/ast.ts#L475)

Node type discriminator

#### Overrides

[`BaseNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md).[`type`](https://getpromptscript.dev/api-reference/core/src/interfaces/BaseNode/index.md#type)