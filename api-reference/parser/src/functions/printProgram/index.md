# printProgram()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: printProgram()

> **printProgram**(`program`, `comments?`): `string`

Defined in: [parser/src/printer.ts:711](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/parser/src/printer.ts#L711)

Print a parsed program as canonical `.prs` source (2-space indent), in the
order the author wrote it.

Comments live beside the AST, so pass the `comments` from the same
`parseCanonical` result; without them none are printed. Each comment is
printed above the next declaration or entry, trailing on its line, or before
the closing brace of its container, including inside nested objects and
arrays. A blank line is kept where the source had one or more (at most one, never
at the edge of a block, object, array or file), and an array that does not fit in
100 characters is printed one element per line. Printing the reparsed output gives
the same text.

Known limits: comments inside `@meta` move before its closing brace (tracked
in #555), and comments in the parameter list of `@use` or `@inherit` are printed
before the next declaration. Blank lines inside `@meta` and those parameter lists are dropped.

## Parameters

### program

Canonical program from `parseCanonical`

#### agentProvenance?

readonly `object`[]

#### blocks

readonly `object`[]

#### extends

readonly `object`[]

#### inherit?

\{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `params?`: readonly `object`[]; `path`: \{ `isRelative`: `boolean`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `namespace?`: `string`; `raw`: `string`; `segments`: readonly `string`[]; `type`: `"PathReference"`; `version?`: `string`; \}; `type`: `"InheritDeclaration"`; \}

#### inherit.loc

\{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}

Source location

#### inherit.loc.column

`number`

Column number (1-indexed)

#### inherit.loc.file

`string`

File path

#### inherit.loc.line

`number`

Line number (1-indexed)

#### inherit.loc.offset?

`number`

Byte offset from start of file

#### inherit.params?

readonly `object`[]

Template parameters (for parameterized inheritance)

#### inherit.path

\{ `isRelative`: `boolean`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `namespace?`: `string`; `raw`: `string`; `segments`: readonly `string`[]; `type`: `"PathReference"`; `version?`: `string`; \}

Path to parent file

#### inherit.path.isRelative

`boolean`

Whether this is a relative path

#### inherit.path.loc

\{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}

Source location

#### inherit.path.loc.column

`number`

Column number (1-indexed)

#### inherit.path.loc.file

`string`

File path

#### inherit.path.loc.line

`number`

Line number (1-indexed)

#### inherit.path.loc.offset?

`number`

Byte offset from start of file

#### inherit.path.namespace?

`string`

Namespace (e.g., "core" from "@core/...")

#### inherit.path.raw

`string`

Original string representation

#### inherit.path.segments

readonly `string`[]

Path segments

#### inherit.path.type

`"PathReference"`

Node type discriminator

#### inherit.path.version?

`string`

Version constraint

#### inherit.type

`"InheritDeclaration"`

Node type discriminator

#### loc

\{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}

#### loc.column

`number`

Column number (1-indexed)

#### loc.file

`string`

File path

#### loc.line

`number`

Line number (1-indexed)

#### loc.offset?

`number`

Byte offset from start of file

#### meta?

\{ `fields`: \{\[`key`: `string`\]: [`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ `constraints?`: \{ `max?`: `number`; `min?`: `number`; `options?`: readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (PrimitiveValue \| .....[]; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `params?`: readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (PrimitiveValue \| .....[]; `type`: `"TypeExpression"`; \} \| readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (PrimitiveValue \| .....[] \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \} \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (PrimitiveValue \| .....; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateExpression"`; \}; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `params?`: readonly `object`[]; `type`: `"MetaBlock"`; \}

#### meta.fields

\{\[`key`: `string`\]: [`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ `constraints?`: \{ `max?`: `number`; `min?`: `number`; `options?`: readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (PrimitiveValue \| .....[]; \}; `kind`: `"string"` \| `"number"` \| `"boolean"` \| `"list"` \| `"enum"` \| `"range"`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `params?`: readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (PrimitiveValue \| .....[]; `type`: `"TypeExpression"`; \} \| readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (PrimitiveValue \| .....[] \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \} \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (PrimitiveValue \| .....; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"TemplateExpression"`; \}; \}

Key-value pairs

#### meta.loc

\{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}

Source location

#### meta.loc.column

`number`

Column number (1-indexed)

#### meta.loc.file

`string`

File path

#### meta.loc.line

`number`

Line number (1-indexed)

#### meta.loc.offset?

`number`

Byte offset from start of file

#### meta.params?

readonly `object`[]

Template parameter definitions (for parameterized inheritance)

#### meta.type

`"MetaBlock"`

Node type discriminator

#### operations

readonly (\{ `declaration`: \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `params?`: readonly `object`[]; `path`: \{ `isRelative`: `boolean`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `namespace?`: `string`; `raw`: `string`; `segments`: readonly `string`[]; `type`: `"PathReference"`; `version?`: `string`; \}; `type`: `"InheritDeclaration"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `sourceLayerId`: `string`; `type`: `"InheritOperation"`; \} \| \{ `declaration`: \{ `alias?`: `string`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `outputDir?`: `string`; `params?`: readonly `object`[]; `path`: \{ `isRelative`: `boolean`; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `namespace?`: `string`; `raw`: `string`; `segments`: readonly `string`[]; `type`: `"PathReference"`; `version?`: `string`; \}; `type`: `"UseDeclaration"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `sourceLayerId`: `string`; `type`: `"UseOperation"`; \} \| \{ `block`: \{ `body`: \{ `entries`: readonly (\{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `text`: `string`; `type`: `"TextEntry"`; \} \| \{ `defaultValue?`: \{ `loc`: ...; `type`: ...; `value`: ...; \} \| \{ `elements`: ...; `loc`: ...; `type`: ...; \} \| \{ `loc`: ...; `type`: ...; `value`: ...; \} \| \{ `loc`: ...; `name`: ...; `type`: ...; \} \| \{ `expression`: ...; `loc`: ...; `type`: ...; \} \| \{ `fields`: ...; `loc`: ...; `type`: ...; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `name`: `string`; `optional?`: `boolean`; `type`: `"FieldEntry"`; `value`: \{ `loc`: ...; `type`: ...; `value`: ...; \} \| \{ `elements`: ...; `loc`: ...; `type`: ...; \} \| \{ `loc`: ...; `type`: ...; `value`: ...; \} \| \{ `loc`: ...; `name`: ...; `type`: ...; \} \| \{ `expression`: ...; `loc`: ...; `type`: ...; \} \| \{ `fields`: ...; `loc`: ...; `type`: ...; \}; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `type`: `"ListEntry"`; `value`: \{ `loc`: ...; `type`: ...; `value`: ...; \} \| \{ `elements`: ...; `loc`: ...; `type`: ...; \} \| \{ `loc`: ...; `type`: ...; `value`: ...; \} \| \{ `loc`: ...; `name`: ...; `type`: ...; \} \| \{ `expression`: ...; `loc`: ...; `type`: ...; \} \| \{ `fields`: ...; `loc`: ...; `type`: ...; \}; \} \| \{ `declaration`: \{ `alias?`: ... \| ...; `loc`: \{ `column`: ...; `file`: ...; `line`: ...; `offset?`: ...; \}; `outputDir?`: ... \| ...; `params?`: ... \| ...; `path`: \{ `isRelative`: ...; `loc`: ...; `namespace?`: ...; `raw`: ...; `segments`: ...; `type`: ...; `version?`: ...; \}; `type`: `"InlineUseDeclaration"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `type`: `"InlineUseEntry"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `sectionId?`: `string`; `sectionLoc?`: \{ `column`: ...; `file`: ...; `line`: ...; `offset?`: ...; \}; `source`: `"explicit"` \| `"legacy"`; `title`: `string`; `titleLoc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `type`: `"PresentationEntry"`; \})[]; `legacyProjection?`: `"TextContent"` \| `"ObjectContent"` \| `"ArrayContent"` \| `"MixedContent"`; `legacyText?`: \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `shape`: `"object"` \| `"text"` \| `"array"` \| `"mixed"`; `type`: `"BlockBody"`; \}; `content`: \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \} \| \{ `inlineUses?`: readonly `object`[]; `listItems?`: readonly ([`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ `constraints?`: ...; `kind`: ...; `loc`: ...; `params?`: ...; `type`: ...; \} \| readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (Primitive... \| \{ `loc`: ...; `type`: ...; `value`: ...; \} \| \{\[`key`: ...\]: ...; \} \| \{ `loc`: ...; `name`: ...; `type`: ...; \})[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `properties`: \{\[`key`: `string`\]: [`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ `constraints?`: ... \| ...; `kind`: ... \| ... \| ... \| ... \| ... \| ...; `loc`: \{ `column`: ...; `file`: ...; `line`: ...; `offset?`: ...; \}; `params?`: ... \| ...; `type`: `"TypeExpression"`; \} \| readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (PrimitiveValue \| .....[] \| \{ `loc`: \{ `column`: ...; `file`: ...; `line`: ...; `offset?`: ...; \}; `type`: `"TextContent"`; `value`: `string`; \} \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (PrimitiveValue \| .....; \} \| \{ `loc`: \{ `column`: ...; `file`: ...; `line`: ...; `offset?`: ...; \}; `name`: `string`; `type`: `"TemplateExpression"`; \}; \}; `type`: `"ObjectContent"`; \} \| \{ `elements`: readonly ([`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ `constraints?`: ... \| ...; `kind`: ... \| ... \| ... \| ... \| ... \| ...; `loc`: \{ `column`: ...; `file`: ...; `line`: ...; `offset?`: ...; \}; `params?`: ... \| ...; `type`: `"TypeExpression"`; \} \| readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (Primitive... \| \{ `loc`: \{ `column`: ...; `file`: ...; `line`: ...; `offset?`: ...; \}; `type`: `"TextContent"`; `value`: `string`; \} \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (PrimitiveValue \| .....; \} \| \{ `loc`: \{ `column`: ...; `file`: ...; `line`: ...; `offset?`: ...; \}; `name`: `string`; `type`: `"TemplateExpression"`; \})[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ArrayContent"`; \} \| \{ `inlineUses?`: readonly `object`[]; `listItems?`: readonly ([`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ `constraints?`: ...; `kind`: ...; `loc`: ...; `params?`: ...; `type`: ...; \} \| readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (Primitive... \| \{ `loc`: ...; `type`: ...; `value`: ...; \} \| \{\[`key`: ...\]: ...; \} \| \{ `loc`: ...; `name`: ...; `type`: ...; \})[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `properties`: \{\[`key`: `string`\]: [`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ `constraints?`: ... \| ...; `kind`: ... \| ... \| ... \| ... \| ... \| ...; `loc`: \{ `column`: ...; `file`: ...; `line`: ...; `offset?`: ...; \}; `params?`: ... \| ...; `type`: `"TypeExpression"`; \} \| readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (PrimitiveValue \| .....[] \| \{ `loc`: \{ `column`: ...; `file`: ...; `line`: ...; `offset?`: ...; \}; `type`: `"TextContent"`; `value`: `string`; \} \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (PrimitiveValue \| .....; \} \| \{ `loc`: \{ `column`: ...; `file`: ...; `line`: ...; `offset?`: ...; \}; `name`: `string`; `type`: `"TemplateExpression"`; \}; \}; `text?`: \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `type`: `"TextContent"`; `value`: `string`; \}; `type`: `"MixedContent"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `name`: `string`; `type`: `"CanonicalBlock"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `sourceLayerId`: `string`; `type`: `"BlockOperation"`; \} \| \{ `extension`: \{ `body`: \{ `entries`: readonly (\{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `text`: `string`; `type`: `"TextEntry"`; \} \| \{ `defaultValue?`: \{ `loc`: ...; `type`: ...; `value`: ...; \} \| \{ `elements`: ...; `loc`: ...; `type`: ...; \} \| \{ `loc`: ...; `type`: ...; `value`: ...; \} \| \{ `loc`: ...; `name`: ...; `type`: ...; \} \| \{ `expression`: ...; `loc`: ...; `type`: ...; \} \| \{ `fields`: ...; `loc`: ...; `type`: ...; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `name`: `string`; `optional?`: `boolean`; `type`: `"FieldEntry"`; `value`: \{ `loc`: ...; `type`: ...; `value`: ...; \} \| \{ `elements`: ...; `loc`: ...; `type`: ...; \} \| \{ `loc`: ...; `type`: ...; `value`: ...; \} \| \{ `loc`: ...; `name`: ...; `type`: ...; \} \| \{ `expression`: ...; `loc`: ...; `type`: ...; \} \| \{ `fields`: ...; `loc`: ...; `type`: ...; \}; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `type`: `"ListEntry"`; `value`: \{ `loc`: ...; `type`: ...; `value`: ...; \} \| \{ `elements`: ...; `loc`: ...; `type`: ...; \} \| \{ `loc`: ...; `type`: ...; `value`: ...; \} \| \{ `loc`: ...; `name`: ...; `type`: ...; \} \| \{ `expression`: ...; `loc`: ...; `type`: ...; \} \| \{ `fields`: ...; `loc`: ...; `type`: ...; \}; \} \| \{ `declaration`: \{ `alias?`: ... \| ...; `loc`: \{ `column`: ...; `file`: ...; `line`: ...; `offset?`: ...; \}; `outputDir?`: ... \| ...; `params?`: ... \| ...; `path`: \{ `isRelative`: ...; `loc`: ...; `namespace?`: ...; `raw`: ...; `segments`: ...; `type`: ...; `version?`: ...; \}; `type`: `"InlineUseDeclaration"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `type`: `"InlineUseEntry"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `sectionId?`: `string`; `sectionLoc?`: \{ `column`: ...; `file`: ...; `line`: ...; `offset?`: ...; \}; `source`: `"explicit"` \| `"legacy"`; `title`: `string`; `titleLoc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `type`: `"PresentationEntry"`; \})[]; `legacyProjection?`: `"TextContent"` \| `"ObjectContent"` \| `"ArrayContent"` \| `"MixedContent"`; `legacyText?`: \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `shape`: `"object"` \| `"text"` \| `"array"` \| `"mixed"`; `type`: `"BlockBody"`; \}; `content`: \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"TextContent"`; `value`: `string`; \} \| \{ `inlineUses?`: readonly `object`[]; `listItems?`: readonly ([`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ `constraints?`: ...; `kind`: ...; `loc`: ...; `params?`: ...; `type`: ...; \} \| readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (Primitive... \| \{ `loc`: ...; `type`: ...; `value`: ...; \} \| \{\[`key`: ...\]: ...; \} \| \{ `loc`: ...; `name`: ...; `type`: ...; \})[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `properties`: \{\[`key`: `string`\]: [`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ `constraints?`: ... \| ...; `kind`: ... \| ... \| ... \| ... \| ... \| ...; `loc`: \{ `column`: ...; `file`: ...; `line`: ...; `offset?`: ...; \}; `params?`: ... \| ...; `type`: `"TypeExpression"`; \} \| readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (PrimitiveValue \| .....[] \| \{ `loc`: \{ `column`: ...; `file`: ...; `line`: ...; `offset?`: ...; \}; `type`: `"TextContent"`; `value`: `string`; \} \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (PrimitiveValue \| .....; \} \| \{ `loc`: \{ `column`: ...; `file`: ...; `line`: ...; `offset?`: ...; \}; `name`: `string`; `type`: `"TemplateExpression"`; \}; \}; `type`: `"ObjectContent"`; \} \| \{ `elements`: readonly ([`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ `constraints?`: ... \| ...; `kind`: ... \| ... \| ... \| ... \| ... \| ...; `loc`: \{ `column`: ...; `file`: ...; `line`: ...; `offset?`: ...; \}; `params?`: ... \| ...; `type`: `"TypeExpression"`; \} \| readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (Primitive... \| \{ `loc`: \{ `column`: ...; `file`: ...; `line`: ...; `offset?`: ...; \}; `type`: `"TextContent"`; `value`: `string`; \} \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (PrimitiveValue \| .....; \} \| \{ `loc`: \{ `column`: ...; `file`: ...; `line`: ...; `offset?`: ...; \}; `name`: `string`; `type`: `"TemplateExpression"`; \})[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ArrayContent"`; \} \| \{ `inlineUses?`: readonly `object`[]; `listItems?`: readonly ([`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ `constraints?`: ...; `kind`: ...; `loc`: ...; `params?`: ...; `type`: ...; \} \| readonly (PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (Primitive... \| \{ `loc`: ...; `type`: ...; `value`: ...; \} \| \{\[`key`: ...\]: ...; \} \| \{ `loc`: ...; `name`: ...; `type`: ...; \})[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `properties`: \{\[`key`: `string`\]: [`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md) \| \{ `constraints?`: ... \| ...; `kind`: ... \| ... \| ... \| ... \| ... \| ...; `loc`: \{ `column`: ...; `file`: ...; `line`: ...; `offset?`: ...; \}; `params?`: ... \| ...; `type`: `"TypeExpression"`; \} \| readonly PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (PrimitiveValue \| .....[] \| \{ `loc`: \{ `column`: ...; `file`: ...; `line`: ...; `offset?`: ...; \}; `type`: `"TextContent"`; `value`: `string`; \} \| \{\[`key`: `string`\]: PrimitiveValue \| \{ readonly type: "TypeExpression"; readonly kind: "string" \| "number" \| "boolean" \| "list" \| "enum" \| "range"; readonly params?: readonly (PrimitiveValue \| ... 4 more ... \| \{ ...; \})\[\] \| undefined; readonly constraints?: \{ ...; \} \| undefined; readonly loc: \{ ...; \}; \} \| readonly (PrimitiveValue \| .....; \} \| \{ `loc`: \{ `column`: ...; `file`: ...; `line`: ...; `offset?`: ...; \}; `name`: `string`; `type`: `"TemplateExpression"`; \}; \}; `text?`: \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `type`: `"TextContent"`; `value`: `string`; \}; `type`: `"MixedContent"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `replacements?`: readonly `object`[]; `targetPath`: `string`; `type`: `"CanonicalExtendBlock"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `sourceLayerId`: `string`; `type`: `"ExtendOperation"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `override`: \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `replacement`: \{ `body`: \{ `entries`: readonly (\{ `loc`: ...; `text`: ...; `type`: ...; \} \| \{ `defaultValue?`: ...; `loc`: ...; `name`: ...; `optional?`: ...; `type`: ...; `value`: ...; \} \| \{ `loc`: ...; `type`: ...; `value`: ...; \} \| \{ `declaration`: ...; `loc`: ...; `type`: ...; \} \| \{ `loc`: ...; `sectionId?`: ...; `sectionLoc?`: ...; `source`: ...; `title`: ...; `titleLoc`: ...; `type`: ...; \})[]; `legacyProjection?`: `"TextContent"` \| `"ObjectContent"` \| `"ArrayContent"` \| `"MixedContent"`; `legacyText?`: \{ `loc`: \{ `column`: ...; `file`: ...; `line`: ...; `offset?`: ...; \}; `type`: `"TextContent"`; `value`: `string`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `shape`: `"object"` \| `"text"` \| `"array"` \| `"mixed"`; `type`: `"BlockBody"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"BlockReplacement"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: `number`; \}; `type`: `"ValueReplacement"`; `value`: \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `type`: `"ScalarValueNode"`; `value`: [`PrimitiveValue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PrimitiveValue/index.md); \} \| \{ `elements`: readonly `object`[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `type`: `"ArrayValueNode"`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `type`: `"TextValueNode"`; `value`: `string`; \} \| \{ `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `name`: `string`; `type`: `"TemplateValueNode"`; \} \| \{ `expression`: \{ `constraints?`: ... \| ...; `kind`: ... \| ... \| ... \| ... \| ... \| ...; `loc`: \{ `column`: ...; `file`: ...; `line`: ...; `offset?`: ...; \}; `params?`: ... \| ...; `type`: `"TypeExpression"`; \}; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `type`: `"TypeExpressionValueNode"`; \} \| \{ `fields`: readonly `object`[]; `loc`: \{ `column`: `number`; `file`: `string`; `line`: `number`; `offset?`: ... \| ...; \}; `type`: `"ObjectValueNode"`; \}; \}; `targetPath`: `string`; `type`: `"CanonicalOverrideBlock"`; \}; `sourceLayerId`: `string`; `type`: `"OverrideOperation"`; \})[]

#### overrides?

readonly `object`[]

#### syntaxFeatures?

readonly `object`[]

#### type

`"CanonicalProgram"`

#### uses

readonly `object`[]

### comments?

readonly [`Comment`](https://getpromptscript.dev/api-reference/parser/src/interfaces/Comment/index.md)[] = `[]`

Comments from the same parse result

## Returns

`string`

`.prs` source ending with a newline

## Throws

If the AST holds a non-finite number, which `.prs` cannot express

## Example

```typescript
const { ast, comments } = parseCanonical('# note\n@identity { a: 1 }');
console.log(printProgram(ast!, comments));
```