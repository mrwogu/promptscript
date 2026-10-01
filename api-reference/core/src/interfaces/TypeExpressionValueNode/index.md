# TypeExpressionValueNode

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: TypeExpressionValueNode

Defined in: [core/src/types/ast.ts:527](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L527)

Canonical type expression value.

## Extends

- [`CanonicalNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md)

## Properties

### expression

> `readonly` **expression**: `object`

Defined in: [core/src/types/ast.ts:529](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L529)

#### constraints?

> `readonly` `optional` **constraints?**: `object`

Constraints

##### constraints.max?

> `readonly` `optional` **max?**: `number`

##### constraints.min?

> `readonly` `optional` **min?**: `number`

##### constraints.options?

> `readonly` `optional` **options?**: readonly ([`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... \| \{ readonly type: "TextContent"; readonly value: string; readonly loc: \{ ...; \}; \} \| readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| \{ ...; \} \| \{ ... \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \} \| readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly... \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateExpression"`; \})[]

#### kind

> `readonly` **kind**: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`

Type kind

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

> `readonly` `optional` **params?**: readonly ([`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... \| \{ readonly type: "TextContent"; readonly value: string; readonly loc: \{ ...; \}; \} \| readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| \{ ...; \} \| \{ ... \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \} \| readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly... \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| \{ ...; \} \| readonly (Primitiv...; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateExpression"`; \})[]

Type parameters

#### type

> `readonly` **type**: `"TypeExpression"`

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

### type

> `readonly` **type**: `"TypeExpressionValueNode"`

Defined in: [core/src/types/ast.ts:528](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L528)

#### Overrides

[`CanonicalNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md).[`type`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md#type)