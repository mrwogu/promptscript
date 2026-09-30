# ParseOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ParseOptions

Defined in: [parser/src/parse.ts:11](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/parser/src/parse.ts#L11)

Options for parsing PromptScript source code.

## Properties

### envProvider?

> `optional` **envProvider?**: [`EnvProvider`](https://getpromptscript.dev/api-reference/parser/src/type-aliases/EnvProvider/index.md)

Defined in: [parser/src/parse.ts:36](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/parser/src/parse.ts#L36)

Custom environment provider function for variable interpolation.
When provided, this function is used to look up environment variable values
instead of the default process.env lookup.
Only used when interpolateEnv is true.

***

### filename?

> `optional` **filename?**: `string`

Defined in: [parser/src/parse.ts:13](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/parser/src/parse.ts#L13)

Filename for error reporting. Defaults to '<unknown>'.

***

### interpolateEnv?

> `optional` **interpolateEnv?**: `boolean`

Defined in: [parser/src/parse.ts:29](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/parser/src/parse.ts#L29)

Enable environment variable interpolation. Defaults to false.
When true, ${VAR} and ${VAR:-default} syntax will be replaced with
actual environment variable values.

***

### recovery?

> `optional` **recovery?**: `boolean`

Defined in: [parser/src/parse.ts:23](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/parser/src/parse.ts#L23)

Enable recovery mode for partial parsing. Alias for `tolerant`.
When true, the parser will attempt to continue after errors.

***

### tolerant?

> `optional` **tolerant?**: `boolean`

Defined in: [parser/src/parse.ts:18](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/parser/src/parse.ts#L18)

Continue parsing even when errors are encountered. Defaults to false.
Alias: `recovery`