# BlockBody

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: BlockBody

Defined in: [core/src/types/ast.ts:632](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L632)

Uniform canonical body shared by every block type.

## Extends

- [`CanonicalNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md)

## Properties

### entries

> `readonly` **entries**: readonly [`BlockEntry`](https://getpromptscript.dev/api-reference/core/src/type-aliases/BlockEntry/index.md)[]

Defined in: [core/src/types/ast.ts:635](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L635)

***

### legacyProjection?

> `readonly` `optional` **legacyProjection?**: `"TextContent"` \| `"ObjectContent"` \| `"ArrayContent"` \| `"MixedContent"`

Defined in: [core/src/types/ast.ts:637](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L637)

Original legacy projection, retained across immutable updates

***

### legacyText?

> `readonly` `optional` **legacyText?**: `object`

Defined in: [core/src/types/ast.ts:639](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L639)

Exact resolved text projection when entries retain multiple source fragments

#### loc

> `readonly` **loc**: `object`

Source location

##### loc.column

> `readonly` **column**: `number`

Column number (1-indexed)

##### loc.file

> `readonly` **file**: `string`

File path

##### loc.line

> `readonly` **line**: `number`

Line number (1-indexed)

##### loc.offset?

> `readonly` `optional` **offset?**: `number`

Byte offset from start of file

#### type

> `readonly` **type**: `"TextContent"`

Node type discriminator

#### value

> `readonly` **value**: `string`

Text value (without delimiters)

***

### loc

> `readonly` **loc**: `object`

Defined in: [core/src/types/ast.ts:497](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L497)

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

### shape

> `readonly` **shape**: `"object"` \| `"array"` \| `"text"` \| `"mixed"`

Defined in: [core/src/types/ast.ts:634](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L634)

***

### type

> `readonly` **type**: `"BlockBody"`

Defined in: [core/src/types/ast.ts:633](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L633)

#### Overrides

[`CanonicalNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md).[`type`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md#type)