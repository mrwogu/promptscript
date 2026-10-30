# CompileOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CompileOptions

Defined in: [compiler/src/compiler.ts:1446](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/compiler/src/compiler.ts#L1446)

Options for the standalone compile function.

## Properties

### customConventions?

> `optional` **customConventions?**: `Record`\<`string`, [`OutputConvention`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputConvention/index.md)\>

Defined in: [compiler/src/compiler.ts:1472](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/compiler/src/compiler.ts#L1472)

Custom conventions for formatters.

***

### formatters?

> `optional` **formatters?**: (`string` \| [`Formatter`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md) \| \{ `config?`: [`TargetConfig`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/TargetConfig/index.md); `name`: `string`; \})[]

Defined in: [compiler/src/compiler.ts:1468](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/compiler/src/compiler.ts#L1468)

Formatters to use. If not specified, all built-in formatters are used.

***

### models?

> `optional` **models?**: [`ModelsConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelsConfig/index.md)

Defined in: [compiler/src/compiler.ts:1480](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/compiler/src/compiler.ts#L1480)

Model catalog settings (`models` in promptscript.yaml).

***

### prettier?

> `optional` **prettier?**: [`PrettierMarkdownOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/PrettierMarkdownOptions/index.md)

Defined in: [compiler/src/compiler.ts:1476](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/compiler/src/compiler.ts#L1476)

Prettier formatting options for markdown output.

***

### resolver?

> `optional` **resolver?**: `object`

Defined in: [compiler/src/compiler.ts:1451](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/compiler/src/compiler.ts#L1451)

Resolver options for resolving imports and inheritance.
If not provided, defaults to current working directory.

#### cache?

> `optional` **cache?**: `boolean`

Whether to cache resolved ASTs. Defaults to true.

#### localPath?

> `optional` **localPath?**: `string`

Base path for local/relative file resolution. Defaults to cwd.

#### projectRoot?

> `optional` **projectRoot?**: `string`

Project root containing .promptscript/scripts.

#### registryPath?

> `optional` **registryPath?**: `string`

Base path for registry lookups (@namespace/...). Defaults to cwd.

***

### skillContent?

> `optional` **skillContent?**: `string`

Defined in: [compiler/src/compiler.ts:1484](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/compiler/src/compiler.ts#L1484)

Content of the PromptScript SKILL.md to inject into compilation output.

***

### validator?

> `optional` **validator?**: [`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md)

Defined in: [compiler/src/compiler.ts:1464](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/compiler/src/compiler.ts#L1464)

Validator configuration.