# BlockBodyOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: BlockBodyOptions

Defined in: [core/src/canonical-ast.ts:51](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/canonical-ast.ts#L51)

## Properties

### projection?

> `readonly` `optional` **projection?**: `"TextContent"` \| `"ObjectContent"` \| `"ArrayContent"` \| `"MixedContent"`

Defined in: [core/src/canonical-ast.ts:52](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/canonical-ast.ts#L52)

***

### text?

> `readonly` `optional` **text?**: `object`

Defined in: [core/src/canonical-ast.ts:53](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/canonical-ast.ts#L53)

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