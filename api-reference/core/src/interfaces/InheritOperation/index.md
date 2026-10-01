# InheritOperation

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: InheritOperation

Defined in: [core/src/types/ast.ts:675](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L675)

Canonical inheritance operation.

## Extends

- [`CanonicalNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md)

## Properties

### declaration

> `readonly` **declaration**: `object`

Defined in: [core/src/types/ast.ts:677](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L677)

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

#### params?

> `readonly` `optional` **params?**: readonly `object`[]

Template parameters (for parameterized inheritance)

#### path

> `readonly` **path**: `object`

Path to parent file

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

> `readonly` **type**: `"InheritDeclaration"`

Node type discriminator

***

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

### sourceLayerId

> `readonly` **sourceLayerId**: `string`

Defined in: [core/src/types/ast.ts:678](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L678)

***

### type

> `readonly` **type**: `"InheritOperation"`

Defined in: [core/src/types/ast.ts:676](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L676)

#### Overrides

[`CanonicalNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md).[`type`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md#type)