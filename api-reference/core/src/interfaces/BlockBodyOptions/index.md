# BlockBodyOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: BlockBodyOptions

Defined in: [core/src/canonical-ast.ts:55](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/canonical-ast.ts#L55)

## Properties

### projection?

> `readonly` `optional` **projection?**: `"TextContent"` \| `"ObjectContent"` \| `"ArrayContent"` \| `"MixedContent"`

Defined in: [core/src/canonical-ast.ts:56](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/canonical-ast.ts#L56)

***

### text?

> `readonly` `optional` **text?**: `object`

Defined in: [core/src/canonical-ast.ts:57](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/canonical-ast.ts#L57)

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