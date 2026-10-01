# CanonicalOverrideBlock

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CanonicalOverrideBlock

Defined in: [core/src/types/ast.ts:666](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L666)

Immutable canonical override block.

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

### replacement

> `readonly` **replacement**: \{ `body`: \{ `entries`: readonly (\{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `text`: `string`; `type`: `"TextEntry"`; \} \| \{ `defaultValue?`: \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ScalarValueNode"`; `value`: [`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md); \} \| \{ `elements`: readonly `object`[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ArrayValueNode"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextValueNode"`; `value`: `string`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateValueNode"`; \} \| \{ `expression`: \{ `constraints?`: \{ `max?`: ...; `min?`: ...; `options?`: ...; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `params?`: readonly ...[]; `type`: `"TypeExpression"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TypeExpressionValueNode"`; \} \| \{ `fields`: readonly `object`[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ObjectValueNode"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `optional?`: `boolean`; `type`: `"FieldEntry"`; `value`: \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ScalarValueNode"`; `value`: [`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md); \} \| \{ `elements`: readonly `object`[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ArrayValueNode"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextValueNode"`; `value`: `string`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateValueNode"`; \} \| \{ `expression`: \{ `constraints?`: \{ `max?`: ...; `min?`: ...; `options?`: ...; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `params?`: readonly ...[]; `type`: `"TypeExpression"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TypeExpressionValueNode"`; \} \| \{ `fields`: readonly `object`[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ObjectValueNode"`; \}; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ListEntry"`; `value`: \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ScalarValueNode"`; `value`: [`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md); \} \| \{ `elements`: readonly `object`[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ArrayValueNode"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextValueNode"`; `value`: `string`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateValueNode"`; \} \| \{ `expression`: \{ `constraints?`: \{ `max?`: ...; `min?`: ...; `options?`: ...; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `params?`: readonly ...[]; `type`: `"TypeExpression"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TypeExpressionValueNode"`; \} \| \{ `fields`: readonly `object`[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ObjectValueNode"`; \}; \} \| \{ `declaration`: \{ `alias?`: `string`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `outputDir?`: `string`; `params?`: readonly `object`[]; `path`: \{ `isRelative`: `boolean`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `namespace?`: `string`; `raw`: `string`; `segments`: readonly `string`[]; `type`: `"PathReference"`; `version?`: `string`; \}; `type`: `"InlineUseDeclaration"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"InlineUseEntry"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `sectionId?`: `string`; `sectionLoc?`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `source`: `"explicit"` \| `"legacy"`; `title`: `string`; `titleLoc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"PresentationEntry"`; \})[]; `legacyProjection?`: `"TextContent"` \| `"ObjectContent"` \| `"ArrayContent"` \| `"MixedContent"`; `legacyText?`: \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `shape`: `"object"` \| `"array"` \| `"text"` \| `"mixed"`; `type`: `"BlockBody"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"BlockReplacement"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ValueReplacement"`; `value`: \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ScalarValueNode"`; `value`: [`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md); \} \| \{ `elements`: readonly `object`[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ArrayValueNode"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextValueNode"`; `value`: `string`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateValueNode"`; \} \| \{ `expression`: \{ `constraints?`: \{ `max?`: `number`; `min?`: `number`; `options?`: readonly ([`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... \| readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| \{ ...; \} \| \{ ...; \} \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; reado... \| readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (Primitive... \| \{ `loc`: ...; `type`: ...; `value`: ...; \} \| \{\[`key`: ...\]: ...; \} \| \{ `loc`: ...; `name`: ...; `type`: ...; \})[]; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `params?`: readonly ([`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... \| readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| \{ ...; \} \| \{ ...; \} \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; reado... \| readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (Primitive... \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `type`: `"TextContent"`; `value`: `string`; \} \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (PrimitiveValue \| .....; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `name`: `string`; `type`: `"TemplateExpression"`; \})[]; `type`: `"TypeExpression"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TypeExpressionValueNode"`; \} \| \{ `fields`: readonly `object`[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ObjectValueNode"`; \}; \}

Defined in: [core/src/types/ast.ts:669](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L669)

#### Union Members

##### Type Literal

\{ `body`: \{ `entries`: readonly (\{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `text`: `string`; `type`: `"TextEntry"`; \} \| \{ `defaultValue?`: \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ScalarValueNode"`; `value`: [`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md); \} \| \{ `elements`: readonly `object`[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ArrayValueNode"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextValueNode"`; `value`: `string`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateValueNode"`; \} \| \{ `expression`: \{ `constraints?`: \{ `max?`: ...; `min?`: ...; `options?`: ...; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `params?`: readonly ...[]; `type`: `"TypeExpression"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TypeExpressionValueNode"`; \} \| \{ `fields`: readonly `object`[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ObjectValueNode"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `optional?`: `boolean`; `type`: `"FieldEntry"`; `value`: \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ScalarValueNode"`; `value`: [`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md); \} \| \{ `elements`: readonly `object`[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ArrayValueNode"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextValueNode"`; `value`: `string`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateValueNode"`; \} \| \{ `expression`: \{ `constraints?`: \{ `max?`: ...; `min?`: ...; `options?`: ...; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `params?`: readonly ...[]; `type`: `"TypeExpression"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TypeExpressionValueNode"`; \} \| \{ `fields`: readonly `object`[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ObjectValueNode"`; \}; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ListEntry"`; `value`: \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ScalarValueNode"`; `value`: [`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md); \} \| \{ `elements`: readonly `object`[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ArrayValueNode"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextValueNode"`; `value`: `string`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateValueNode"`; \} \| \{ `expression`: \{ `constraints?`: \{ `max?`: ...; `min?`: ...; `options?`: ...; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `params?`: readonly ...[]; `type`: `"TypeExpression"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TypeExpressionValueNode"`; \} \| \{ `fields`: readonly `object`[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ObjectValueNode"`; \}; \} \| \{ `declaration`: \{ `alias?`: `string`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `outputDir?`: `string`; `params?`: readonly `object`[]; `path`: \{ `isRelative`: `boolean`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `namespace?`: `string`; `raw`: `string`; `segments`: readonly `string`[]; `type`: `"PathReference"`; `version?`: `string`; \}; `type`: `"InlineUseDeclaration"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"InlineUseEntry"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `sectionId?`: `string`; `sectionLoc?`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `source`: `"explicit"` \| `"legacy"`; `title`: `string`; `titleLoc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"PresentationEntry"`; \})[]; `legacyProjection?`: `"TextContent"` \| `"ObjectContent"` \| `"ArrayContent"` \| `"MixedContent"`; `legacyText?`: \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `shape`: `"object"` \| `"array"` \| `"text"` \| `"mixed"`; `type`: `"BlockBody"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"BlockReplacement"`; \}

##### body

> `readonly` **body**: `object`

###### body.entries

> `readonly` **entries**: readonly (\{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `text`: `string`; `type`: `"TextEntry"`; \} \| \{ `defaultValue?`: \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ScalarValueNode"`; `value`: [`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md); \} \| \{ `elements`: readonly `object`[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ArrayValueNode"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextValueNode"`; `value`: `string`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateValueNode"`; \} \| \{ `expression`: \{ `constraints?`: \{ `max?`: ...; `min?`: ...; `options?`: ...; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `params?`: readonly ...[]; `type`: `"TypeExpression"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TypeExpressionValueNode"`; \} \| \{ `fields`: readonly `object`[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ObjectValueNode"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `optional?`: `boolean`; `type`: `"FieldEntry"`; `value`: \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ScalarValueNode"`; `value`: [`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md); \} \| \{ `elements`: readonly `object`[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ArrayValueNode"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextValueNode"`; `value`: `string`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateValueNode"`; \} \| \{ `expression`: \{ `constraints?`: \{ `max?`: ...; `min?`: ...; `options?`: ...; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `params?`: readonly ...[]; `type`: `"TypeExpression"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TypeExpressionValueNode"`; \} \| \{ `fields`: readonly `object`[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ObjectValueNode"`; \}; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ListEntry"`; `value`: \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ScalarValueNode"`; `value`: [`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md); \} \| \{ `elements`: readonly `object`[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ArrayValueNode"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextValueNode"`; `value`: `string`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateValueNode"`; \} \| \{ `expression`: \{ `constraints?`: \{ `max?`: ...; `min?`: ...; `options?`: ...; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `params?`: readonly ...[]; `type`: `"TypeExpression"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TypeExpressionValueNode"`; \} \| \{ `fields`: readonly `object`[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ObjectValueNode"`; \}; \} \| \{ `declaration`: \{ `alias?`: `string`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `outputDir?`: `string`; `params?`: readonly `object`[]; `path`: \{ `isRelative`: `boolean`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `namespace?`: `string`; `raw`: `string`; `segments`: readonly `string`[]; `type`: `"PathReference"`; `version?`: `string`; \}; `type`: `"InlineUseDeclaration"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"InlineUseEntry"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `sectionId?`: `string`; `sectionLoc?`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `source`: `"explicit"` \| `"legacy"`; `title`: `string`; `titleLoc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"PresentationEntry"`; \})[]

###### body.legacyProjection?

> `readonly` `optional` **legacyProjection?**: `"TextContent"` \| `"ObjectContent"` \| `"ArrayContent"` \| `"MixedContent"`

Original legacy projection, retained across immutable updates

###### body.legacyText?

> `readonly` `optional` **legacyText?**: `object`

Exact resolved text projection when entries retain multiple source fragments

###### body.legacyText.loc

> `readonly` **loc**: `object`

Source location

###### body.legacyText.loc.column

> `readonly` **column**: `number`

Column number (1-indexed)

###### body.legacyText.loc.file

> `readonly` **file**: `string`

File path

###### body.legacyText.loc.line

> `readonly` **line**: `number`

Line number (1-indexed)

###### body.legacyText.loc.offset?

> `readonly` `optional` **offset?**: `number`

Byte offset from start of file

###### body.legacyText.type

> `readonly` **type**: `"TextContent"`

Node type discriminator

###### body.legacyText.value

> `readonly` **value**: `string`

Text value (without delimiters)

###### body.loc

> `readonly` **loc**: `object`

###### body.loc.column

> `readonly` **column**: `number`

Column number (1-indexed)

###### body.loc.file

> `readonly` **file**: `string`

File path

###### body.loc.line

> `readonly` **line**: `number`

Line number (1-indexed)

###### body.loc.offset?

> `readonly` `optional` **offset?**: `number`

Byte offset from start of file

###### body.shape

> `readonly` **shape**: `"object"` \| `"array"` \| `"text"` \| `"mixed"`

###### body.type

> `readonly` **type**: `"BlockBody"`

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

> `readonly` **type**: `"BlockReplacement"`

Node type discriminator

***

##### Type Literal

\{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ValueReplacement"`; `value`: \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ScalarValueNode"`; `value`: [`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md); \} \| \{ `elements`: readonly `object`[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ArrayValueNode"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextValueNode"`; `value`: `string`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateValueNode"`; \} \| \{ `expression`: \{ `constraints?`: \{ `max?`: `number`; `min?`: `number`; `options?`: readonly ([`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... \| readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| \{ ...; \} \| \{ ...; \} \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; reado... \| readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (Primitive... \| \{ `loc`: ...; `type`: ...; `value`: ...; \} \| \{\[`key`: ...\]: ...; \} \| \{ `loc`: ...; `name`: ...; `type`: ...; \})[]; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `params?`: readonly ([`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... \| readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| \{ ...; \} \| \{ ...; \} \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; reado... \| readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (Primitive... \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `type`: `"TextContent"`; `value`: `string`; \} \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (PrimitiveValue \| .....; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `name`: `string`; `type`: `"TemplateExpression"`; \})[]; `type`: `"TypeExpression"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TypeExpressionValueNode"`; \} \| \{ `fields`: readonly `object`[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ObjectValueNode"`; \}; \}

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

> `readonly` **type**: `"ValueReplacement"`

Node type discriminator

##### value

> `readonly` **value**: \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ScalarValueNode"`; `value`: [`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md); \} \| \{ `elements`: readonly `object`[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ArrayValueNode"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextValueNode"`; `value`: `string`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateValueNode"`; \} \| \{ `expression`: \{ `constraints?`: \{ `max?`: `number`; `min?`: `number`; `options?`: readonly ([`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... \| readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| \{ ...; \} \| \{ ...; \} \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; reado... \| readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (Primitive... \| \{ `loc`: ...; `type`: ...; `value`: ...; \} \| \{\[`key`: ...\]: ...; \} \| \{ `loc`: ...; `name`: ...; `type`: ...; \})[]; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `params?`: readonly ([`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... \| readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| \{ ...; \} \| \{ ...; \} \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; reado... \| readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (Primitive... \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `type`: `"TextContent"`; `value`: `string`; \} \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (PrimitiveValue \| .....; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `name`: `string`; `type`: `"TemplateExpression"`; \})[]; `type`: `"TypeExpression"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TypeExpressionValueNode"`; \} \| \{ `fields`: readonly `object`[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ObjectValueNode"`; \}

***

### targetPath

> `readonly` **targetPath**: `string`

Defined in: [core/src/types/ast.ts:668](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L668)

***

### type

> `readonly` **type**: `"CanonicalOverrideBlock"`

Defined in: [core/src/types/ast.ts:667](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L667)

#### Overrides

[`CanonicalNode`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md).[`type`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalNode/index.md#type)