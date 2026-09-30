# CanonicalProgram

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CanonicalProgram

Defined in: [core/src/types/ast.ts:726](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L726)

Immutable canonical program. Legacy collection fields are derived projections.

## Extends

- [`CanonicalNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md)

## Properties

### agentProvenance?

> `readonly` `optional` **agentProvenance?**: readonly `object`[]

Defined in: [core/src/types/ast.ts:734](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L734)

***

### blocks

> `readonly` **blocks**: readonly [`CanonicalBlock`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalBlock/index.md)[]

Defined in: [core/src/types/ast.ts:731](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L731)

***

### extends

> `readonly` **extends**: readonly [`CanonicalExtendBlock`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalExtendBlock/index.md)[]

Defined in: [core/src/types/ast.ts:732](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L732)

***

### inherit?

> `readonly` `optional` **inherit?**: `object`

Defined in: [core/src/types/ast.ts:729](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L729)

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

### meta?

> `readonly` `optional` **meta?**: `object`

Defined in: [core/src/types/ast.ts:728](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L728)

#### fields

> `readonly` **fields**: `object`

Key-value pairs

##### Index Signature

\[`key`: `string`\]: [`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ `constraints?`: \{ `max?`: `number`; `min?`: `number`; `options?`: readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...[]; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `params?`: readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...[]; `type`: `"TypeExpression"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \} \| readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...[] \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateExpression"`; \}

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

Template parameter definitions (for parameterized inheritance)

#### type

> `readonly` **type**: `"MetaBlock"`

Node type discriminator

***

### operations

> `readonly` **operations**: readonly [`ProgramOperation`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ProgramOperation/index.md)[]

Defined in: [core/src/types/ast.ts:736](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L736)

***

### overrides?

> `readonly` `optional` **overrides?**: readonly [`CanonicalOverrideBlock`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalOverrideBlock/index.md)[]

Defined in: [core/src/types/ast.ts:733](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L733)

***

### syntaxFeatures?

> `readonly` `optional` **syntaxFeatures?**: readonly `object`[]

Defined in: [core/src/types/ast.ts:735](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L735)

***

### type

> `readonly` **type**: `"CanonicalProgram"`

Defined in: [core/src/types/ast.ts:727](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L727)

#### Overrides

[`CanonicalNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md).[`type`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md#type)

***

### uses

> `readonly` **uses**: readonly `object`[]

Defined in: [core/src/types/ast.ts:730](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/ast.ts#L730)