# UseOperation

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: UseOperation

Defined in: [core/src/types/ast.ts:684](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L684)

Canonical top-level import operation.

## Extends

- [`CanonicalNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md)

## Properties

### declaration

> `readonly` **declaration**: `object`

Defined in: [core/src/types/ast.ts:686](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L686)

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

### sourceLayerId

> `readonly` **sourceLayerId**: `string`

Defined in: [core/src/types/ast.ts:687](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L687)

***

### type

> `readonly` **type**: `"UseOperation"`

Defined in: [core/src/types/ast.ts:685](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L685)

#### Overrides

[`CanonicalNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md).[`type`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md#type)