# ParseOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ParseOptions

Defined in: [parser/src/parse.ts:12](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/parser/src/parse.ts#L12)

Options for parsing PromptScript source code.

## Properties

### envProvider?

> `optional` **envProvider?**: [`EnvProvider`](https://getpromptscript.dev/api-reference/parser/src/type-aliases/EnvProvider/index.md)

Defined in: [parser/src/parse.ts:37](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/parser/src/parse.ts#L37)

Custom environment provider function for variable interpolation.
When provided, this function is used to look up environment variable values
instead of the default process.env lookup.
Only used when interpolateEnv is true.

***

### filename?

> `optional` **filename?**: `string`

Defined in: [parser/src/parse.ts:14](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/parser/src/parse.ts#L14)

Filename for error reporting. Defaults to '<unknown>'.

***

### interpolateEnv?

> `optional` **interpolateEnv?**: `boolean`

Defined in: [parser/src/parse.ts:30](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/parser/src/parse.ts#L30)

Enable environment variable interpolation. Defaults to false.
When true, ${VAR} and ${VAR:-default} syntax will be replaced with
actual environment variable values.

***

### recovery?

> `optional` **recovery?**: `boolean`

Defined in: [parser/src/parse.ts:24](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/parser/src/parse.ts#L24)

Enable recovery mode for partial parsing. Alias for `tolerant`.
When true, the parser will attempt to continue after errors.

***

### tolerant?

> `optional` **tolerant?**: `boolean`

Defined in: [parser/src/parse.ts:19](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/parser/src/parse.ts#L19)

Continue parsing even when errors are encountered. Defaults to false.
Alias: `recovery`