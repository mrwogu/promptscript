# ArrayValueNode

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ArrayValueNode

Defined in: [core/src/types/ast.ts:545](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/ast.ts#L545)

Canonical array value.

## Extends

- [`CanonicalNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md)

## Properties

### elements

> `readonly` **elements**: readonly [`ArrayElementNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/ArrayElementNode/index.md)[]

Defined in: [core/src/types/ast.ts:547](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/ast.ts#L547)

***

### loc

> `readonly` **loc**: `object`

Defined in: [core/src/types/ast.ts:499](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/ast.ts#L499)

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

### type

> `readonly` **type**: `"ArrayValueNode"`

Defined in: [core/src/types/ast.ts:546](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/ast.ts#L546)

#### Overrides

[`CanonicalNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md).[`type`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md#type)