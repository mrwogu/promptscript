# Comment

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: Comment

Defined in: [parser/src/comments.ts:10](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/parser/src/comments.ts#L10)

A `#` comment or a run of blank lines (`kind: 'blank'`). Neither is part of
the AST; they travel next to it so that resolver, validator and formatters
never see them.

## Properties

### depth

> `readonly` **depth**: `number`

Defined in: [parser/src/comments.ts:21](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/parser/src/comments.ts#L21)

Number of unclosed `{`, `[` and `(` before the comment. 0 means top level.
Without block end positions in the AST, this is what tells a comment after
a block's last entry apart from a comment after the block.

***

### kind

> `readonly` **kind**: `"comment"` \| `"blank"`

Defined in: [parser/src/comments.ts:12](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/parser/src/comments.ts#L12)

`comment` for a `#` comment, `blank` for a run of empty lines the printer may keep as one.

***

### loc

> `readonly` **loc**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [parser/src/comments.ts:15](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/parser/src/comments.ts#L15)

***

### text

> `readonly` **text**: `string`

Defined in: [parser/src/comments.ts:14](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/parser/src/comments.ts#L14)

The full comment including the leading `#`; empty for a blank entry.

***

### trailing

> `readonly` **trailing**: `boolean`

Defined in: [parser/src/comments.ts:26](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/parser/src/comments.ts#L26)

True when a token ends on the line where the comment starts, so the comment
follows code instead of standing on its own line.