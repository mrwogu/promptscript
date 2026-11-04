# ExtendOperation

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ExtendOperation

Defined in: [core/src/types/ast.ts:704](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/ast.ts#L704)

Canonical extension operation.

## Extends

- [`CanonicalNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md)

## Properties

### extension

> `readonly` **extension**: [`CanonicalExtendBlock`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalExtendBlock/index.md)

Defined in: [core/src/types/ast.ts:706](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/ast.ts#L706)

***

### loc

> `readonly` **loc**: `object`

Defined in: [core/src/types/ast.ts:499](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/ast.ts#L499)

#### column

> `readonly` **column**: `number`

Column number (1-indexed)

#### file

> `readonly` **file**: `string`

File path

#### line

> `readonly` **line**: `number`

Line number (1-indexed)

#### offset?

> `readonly` `optional` **offset?**: `number`

Byte offset from start of file

#### Inherited from

[`CanonicalNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md).[`loc`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md#loc)

***

### sourceLayerId

> `readonly` **sourceLayerId**: `string`

Defined in: [core/src/types/ast.ts:707](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/ast.ts#L707)

***

### type

> `readonly` **type**: `"ExtendOperation"`

Defined in: [core/src/types/ast.ts:705](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/ast.ts#L705)

#### Overrides

[`CanonicalNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md).[`type`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md#type)