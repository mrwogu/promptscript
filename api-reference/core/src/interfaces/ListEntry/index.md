# ListEntry

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ListEntry

Defined in: [core/src/types/ast.ts:598](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L598)

Canonical dash-list entry.

## Extends

- [`CanonicalNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md)

## Properties

### loc

> `readonly` **loc**: `object`

Defined in: [core/src/types/ast.ts:497](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L497)

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

> `readonly` **type**: `"ListEntry"`

Defined in: [core/src/types/ast.ts:599](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L599)

#### Overrides

[`CanonicalNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md).[`type`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md#type)

***

### value

> `readonly` **value**: [`ValueNode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ValueNode/index.md)

Defined in: [core/src/types/ast.ts:600](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L600)