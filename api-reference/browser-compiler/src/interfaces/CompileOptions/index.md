# CompileOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CompileOptions

Defined in: [browser-compiler/src/index.ts:96](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/index.ts#L96)

Options for the standalone compile function.

## Properties

### bundledRegistry?

> `optional` **bundledRegistry?**: `boolean`

Defined in: [browser-compiler/src/index.ts:105](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/index.ts#L105)

Whether to include bundled registry files for

#### Inherit

support.
Defaults to true.

***

### customConventions?

> `optional` **customConventions?**: `Record`\<`string`, [`OutputConvention`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputConvention/index.md)\>

Defined in: [browser-compiler/src/index.ts:113](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/index.ts#L113)

Custom conventions for formatters.

***

### envVars?

> `optional` **envVars?**: `Record`\<`string`, `string`\>

Defined in: [browser-compiler/src/index.ts:125](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/index.ts#L125)

Simulated environment variables for interpolation.
When provided, ${VAR} and ${VAR:-default} syntax in source files
will be replaced with values from this map.

***

### formatters?

> `optional` **formatters?**: (`string` \| [`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md) \| \{ `config?`: [`TargetConfig`](https://getpromptscript.dev/api-reference/browser-compiler/src/interfaces/TargetConfig/index.md); `name`: `string`; \})[]

Defined in: [browser-compiler/src/index.ts:100](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/index.ts#L100)

Formatters to use. If not specified, all built-in formatters are used.

***

### prettier?

> `optional` **prettier?**: [`PrettierMarkdownOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/PrettierMarkdownOptions/index.md)

Defined in: [browser-compiler/src/index.ts:117](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/index.ts#L117)

Prettier formatting options for markdown output.

***

### projectRoot?

> `optional` **projectRoot?**: `string`

Defined in: [browser-compiler/src/index.ts:119](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/index.ts#L119)

Virtual project root containing .promptscript/scripts.

***

### validator?

> `optional` **validator?**: [`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md)

Defined in: [browser-compiler/src/index.ts:109](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/index.ts#L109)

Validator configuration.