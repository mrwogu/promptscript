# UseOperation

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: UseOperation

Defined in: [core/src/types/ast.ts:686](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/ast.ts#L686)

Canonical top-level import operation.

## Extends

- [`CanonicalNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md)

## Properties

### declaration

> `readonly` **declaration**: `object`

Defined in: [core/src/types/ast.ts:688](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/ast.ts#L688)

#### alias?

> `readonly` `optional` **alias?**: `string`

Optional alias

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

#### outputDir?

> `readonly` `optional` **outputDir?**: `string`

Optional inline output directory (e.g. `@use foo into skills/seo`).
Stored as a forward-slash relative path. When present this overrides
the global `skillTargets` configuration for this import only.

#### params?

> `readonly` `optional` **params?**: readonly `object`[]

Template parameters (for parameterized imports)

#### path

> `readonly` **path**: `object`

Path to imported file

##### path.isRelative

> `readonly` **isRelative**: `boolean`

Whether this is a relative path

##### path.loc

> `readonly` **loc**: `object`

Source location

##### path.loc.column

> `readonly` **column**: `number`

Column number (1-indexed)

##### path.loc.file

> `readonly` **file**: `string`

File path

##### path.loc.line

> `readonly` **line**: `number`

Line number (1-indexed)

##### path.loc.offset?

> `readonly` `optional` **offset?**: `number`

Byte offset from start of file

##### path.namespace?

> `readonly` `optional` **namespace?**: `string`

Namespace (e.g., "core" from "@core/...")

##### path.raw

> `readonly` **raw**: `string`

Original string representation

##### path.segments

> `readonly` **segments**: readonly `string`[]

Path segments

##### path.type

> `readonly` **type**: `"PathReference"`

Node type discriminator

##### path.version?

> `readonly` `optional` **version?**: `string`

Version constraint

#### type

> `readonly` **type**: `"UseDeclaration"`

Node type discriminator

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

Defined in: [core/src/types/ast.ts:689](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/ast.ts#L689)

***

### type

> `readonly` **type**: `"UseOperation"`

Defined in: [core/src/types/ast.ts:687](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/ast.ts#L687)

#### Overrides

[`CanonicalNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md).[`type`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md#type)