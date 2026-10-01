# CanonicalBlock

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CanonicalBlock

Defined in: [core/src/types/ast.ts:645](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L645)

Immutable canonical block. The legacy content field is a derived projection.

## Extends

- [`CanonicalNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md)

## Properties

### body

> `readonly` **body**: [`BlockBody`](https://getpromptscript.dev/api-reference/core/src/interfaces/BlockBody/index.md)

Defined in: [core/src/types/ast.ts:648](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L648)

***

### content

> `readonly` **content**: \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \} \| \{ `inlineUses?`: readonly `object`[]; `listItems?`: readonly ([`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ `constraints?`: \{ `max?`: `number`; `min?`: `number`; `options?`: readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly...; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `params?`: readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly...; `type`: `"TypeExpression"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \} \| readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly... \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateExpression"`; \})[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `properties`: \{\[`key`: `string`\]: [`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ `constraints?`: \{ `max?`: `number`; `min?`: `number`; `options?`: readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...[]; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `params?`: readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...[]; `type`: `"TypeExpression"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \} \| readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...[] \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateExpression"`; \}; \}; `type`: `"ObjectContent"`; \} \| \{ `elements`: readonly ([`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ `constraints?`: \{ `max?`: `number`; `min?`: `number`; `options?`: readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly...; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `params?`: readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly...; `type`: `"TypeExpression"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \} \| readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly... \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateExpression"`; \})[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ArrayContent"`; \} \| \{ `inlineUses?`: readonly `object`[]; `listItems?`: readonly ([`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ `constraints?`: \{ `max?`: `number`; `min?`: `number`; `options?`: readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly...; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `params?`: readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly...; `type`: `"TypeExpression"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \} \| readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly... \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateExpression"`; \})[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `properties`: \{\[`key`: `string`\]: [`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ `constraints?`: \{ `max?`: `number`; `min?`: `number`; `options?`: readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...[]; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `params?`: readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...[]; `type`: `"TypeExpression"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \} \| readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...[] \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateExpression"`; \}; \}; `text?`: \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \}; `type`: `"MixedContent"`; \}

Defined in: [core/src/types/ast.ts:649](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L649)

#### Union Members

##### Type Literal

\{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \}

##### loc

> `readonly` **loc**: `object`

Source location

###### loc.column

> `readonly` **column**: `number`

Column number (1-indexed)

###### loc.file

> `readonly` **file**: `string`

File path

###### loc.line

> `readonly` **line**: `number`

Line number (1-indexed)

###### loc.offset?

> `readonly` `optional` **offset?**: `number`

Byte offset from start of file

##### type

> `readonly` **type**: `"TextContent"`

Node type discriminator

##### value

> `readonly` **value**: `string`

Text value (without delimiters)

***

##### Type Literal

\{ `inlineUses?`: readonly `object`[]; `listItems?`: readonly ([`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ `constraints?`: \{ `max?`: `number`; `min?`: `number`; `options?`: readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly...; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `params?`: readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly...; `type`: `"TypeExpression"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \} \| readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly... \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateExpression"`; \})[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `properties`: \{\[`key`: `string`\]: [`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ `constraints?`: \{ `max?`: `number`; `min?`: `number`; `options?`: readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...[]; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `params?`: readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...[]; `type`: `"TypeExpression"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \} \| readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...[] \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateExpression"`; \}; \}; `type`: `"ObjectContent"`; \}

##### inlineUses?

> `readonly` `optional` **inlineUses?**: readonly `object`[]

Inline

###### Use

declarations (consumed by resolver, ephemeral)

##### listItems?

> `readonly` `optional` **listItems?**: readonly ([`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ `constraints?`: \{ `max?`: `number`; `min?`: `number`; `options?`: readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly...; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `params?`: readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly...; `type`: `"TypeExpression"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \} \| readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly... \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateExpression"`; \})[]

Dash-list entries interleaved with properties

##### loc

> `readonly` **loc**: `object`

Source location

###### loc.column

> `readonly` **column**: `number`

Column number (1-indexed)

###### loc.file

> `readonly` **file**: `string`

File path

###### loc.line

> `readonly` **line**: `number`

Line number (1-indexed)

###### loc.offset?

> `readonly` `optional` **offset?**: `number`

Byte offset from start of file

##### properties

> `readonly` **properties**: `object`

Properties

###### Index Signature

\[`key`: `string`\]: [`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ `constraints?`: \{ `max?`: `number`; `min?`: `number`; `options?`: readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...[]; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `params?`: readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...[]; `type`: `"TypeExpression"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \} \| readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...[] \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateExpression"`; \}

##### type

> `readonly` **type**: `"ObjectContent"`

Node type discriminator

***

##### Type Literal

\{ `elements`: readonly ([`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ `constraints?`: \{ `max?`: `number`; `min?`: `number`; `options?`: readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly...; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `params?`: readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly...; `type`: `"TypeExpression"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \} \| readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly... \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateExpression"`; \})[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ArrayContent"`; \}

##### elements

> `readonly` **elements**: readonly ([`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ `constraints?`: \{ `max?`: `number`; `min?`: `number`; `options?`: readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly...; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `params?`: readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly...; `type`: `"TypeExpression"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \} \| readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly... \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateExpression"`; \})[]

Array elements

##### loc

> `readonly` **loc**: `object`

Source location

###### loc.column

> `readonly` **column**: `number`

Column number (1-indexed)

###### loc.file

> `readonly` **file**: `string`

File path

###### loc.line

> `readonly` **line**: `number`

Line number (1-indexed)

###### loc.offset?

> `readonly` `optional` **offset?**: `number`

Byte offset from start of file

##### type

> `readonly` **type**: `"ArrayContent"`

Node type discriminator

***

##### Type Literal

\{ `inlineUses?`: readonly `object`[]; `listItems?`: readonly ([`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ `constraints?`: \{ `max?`: `number`; `min?`: `number`; `options?`: readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly...; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `params?`: readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly...; `type`: `"TypeExpression"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \} \| readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly... \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateExpression"`; \})[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `properties`: \{\[`key`: `string`\]: [`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ `constraints?`: \{ `max?`: `number`; `min?`: `number`; `options?`: readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...[]; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `params?`: readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...[]; `type`: `"TypeExpression"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \} \| readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...[] \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateExpression"`; \}; \}; `text?`: \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \}; `type`: `"MixedContent"`; \}

##### inlineUses?

> `readonly` `optional` **inlineUses?**: readonly `object`[]

Inline

###### Use

declarations (consumed by resolver, ephemeral)

##### listItems?

> `readonly` `optional` **listItems?**: readonly ([`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ `constraints?`: \{ `max?`: `number`; `min?`: `number`; `options?`: readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly...; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `params?`: readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly...; `type`: `"TypeExpression"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \} \| readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly... \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateExpression"`; \})[]

Dash-list entries interleaved with text or properties

##### loc

> `readonly` **loc**: `object`

Source location

###### loc.column

> `readonly` **column**: `number`

Column number (1-indexed)

###### loc.file

> `readonly` **file**: `string`

File path

###### loc.line

> `readonly` **line**: `number`

Line number (1-indexed)

###### loc.offset?

> `readonly` `optional` **offset?**: `number`

Byte offset from start of file

##### properties

> `readonly` **properties**: `object`

Properties

###### Index Signature

\[`key`: `string`\]: [`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ `constraints?`: \{ `max?`: `number`; `min?`: `number`; `options?`: readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...[]; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `params?`: readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...[]; `type`: `"TypeExpression"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \} \| readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...[] \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateExpression"`; \}

##### text?

> `readonly` `optional` **text?**: `object`

Optional text content

###### text.loc

> `readonly` **loc**: `object`

Source location

###### text.loc.column

> `readonly` **column**: `number`

Column number (1-indexed)

###### text.loc.file

> `readonly` **file**: `string`

File path

###### text.loc.line

> `readonly` **line**: `number`

Line number (1-indexed)

###### text.loc.offset?

> `readonly` `optional` **offset?**: `number`

Byte offset from start of file

###### text.type

> `readonly` **type**: `"TextContent"`

Node type discriminator

###### text.value

> `readonly` **value**: `string`

Text value (without delimiters)

##### type

> `readonly` **type**: `"MixedContent"`

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

### name

> `readonly` **name**: `string`

Defined in: [core/src/types/ast.ts:647](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L647)

***

### type

> `readonly` **type**: `"CanonicalBlock"`

Defined in: [core/src/types/ast.ts:646](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L646)

#### Overrides

[`CanonicalNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md).[`type`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md#type)