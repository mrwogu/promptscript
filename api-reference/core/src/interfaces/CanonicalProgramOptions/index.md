# CanonicalProgramOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CanonicalProgramOptions

Defined in: [core/src/canonical-ast.ts:56](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/canonical-ast.ts#L56)

## Properties

### agentProvenance?

> `readonly` `optional` **agentProvenance?**: readonly `object`[]

Defined in: [core/src/canonical-ast.ts:59](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/canonical-ast.ts#L59)

***

### loc

> `readonly` **loc**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/canonical-ast.ts:61](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/canonical-ast.ts#L61)

***

### meta?

> `readonly` `optional` **meta?**: `object`

Defined in: [core/src/canonical-ast.ts:57](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/canonical-ast.ts#L57)

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

Defined in: [core/src/canonical-ast.ts:58](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/canonical-ast.ts#L58)

***

### syntaxFeatures?

> `readonly` `optional` **syntaxFeatures?**: readonly `object`[]

Defined in: [core/src/canonical-ast.ts:60](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/canonical-ast.ts#L60)