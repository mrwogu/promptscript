# CompileOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CompileOptions

Defined in: [compiler/src/compiler.ts:1471](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/compiler/src/compiler.ts#L1471)

Options for the standalone compile function.

## Properties

### customConventions?

> `optional` **customConventions?**: `Record`\<`string`, [`OutputConvention`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputConvention/index.md)\>

Defined in: [compiler/src/compiler.ts:1497](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/compiler/src/compiler.ts#L1497)

Custom conventions for formatters.

***

### formatters?

> `optional` **formatters?**: (`string` \| [`Formatter`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md) \| \{ `config?`: [`TargetConfig`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/TargetConfig/index.md); `name`: `string`; \})[]

Defined in: [compiler/src/compiler.ts:1493](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/compiler/src/compiler.ts#L1493)

Formatters to use. If not specified, all built-in formatters are used.

***

### models?

> `optional` **models?**: [`ModelsConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelsConfig/index.md)

Defined in: [compiler/src/compiler.ts:1505](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/compiler/src/compiler.ts#L1505)

Model catalog settings (`models` in promptscript.yaml).

***

### prettier?

> `optional` **prettier?**: [`PrettierMarkdownOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/PrettierMarkdownOptions/index.md)

Defined in: [compiler/src/compiler.ts:1501](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/compiler/src/compiler.ts#L1501)

Prettier formatting options for markdown output.

***

### resolver?

> `optional` **resolver?**: `object`

Defined in: [compiler/src/compiler.ts:1476](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/compiler/src/compiler.ts#L1476)

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

Defined in: [compiler/src/compiler.ts:1509](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/compiler/src/compiler.ts#L1509)

Content of the PromptScript SKILL.md to inject into compilation output.

***

### validator?

> `optional` **validator?**: [`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md)

Defined in: [compiler/src/compiler.ts:1489](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/compiler/src/compiler.ts#L1489)

Validator configuration.