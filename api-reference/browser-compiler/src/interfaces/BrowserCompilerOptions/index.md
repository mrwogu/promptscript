# BrowserCompilerOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: BrowserCompilerOptions

Defined in: [browser-compiler/src/compiler.ts:58](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/compiler.ts#L58)

Options for the browser compiler.

## Properties

### cache?

> `optional` **cache?**: `boolean`

Defined in: [browser-compiler/src/compiler.ts:72](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/compiler.ts#L72)

Whether to cache resolved ASTs. Defaults to true.

***

### customConventions?

> `optional` **customConventions?**: `Record`\<`string`, [`OutputConvention`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputConvention/index.md)\>

Defined in: [browser-compiler/src/compiler.ts:66](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/compiler.ts#L66)

Custom convention definitions

***

### envVars?

> `optional` **envVars?**: `Record`\<`string`, `string`\>

Defined in: [browser-compiler/src/compiler.ts:80](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/compiler.ts#L80)

Simulated environment variables for interpolation.
When provided, ${VAR} and ${VAR:-default} syntax in source files
will be replaced with values from this map.

***

### formatters?

> `optional` **formatters?**: (`string` \| [`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md) \| \{ `config?`: [`TargetConfig`](https://getpromptscript.dev/api-reference/browser-compiler/src/interfaces/TargetConfig/index.md); `name`: `string`; \})[]

Defined in: [browser-compiler/src/compiler.ts:64](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/compiler.ts#L64)

Formatters to use (names, instances, or configs)

***

### fs

> **fs**: [`VirtualFileSystem`](https://getpromptscript.dev/api-reference/browser-compiler/src/classes/VirtualFileSystem/index.md)

Defined in: [browser-compiler/src/compiler.ts:60](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/compiler.ts#L60)

Virtual file system containing all files

***

### logger?

> `optional` **logger?**: [`Logger`](https://getpromptscript.dev/api-reference/core/src/interfaces/Logger/index.md)

Defined in: [browser-compiler/src/compiler.ts:70](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/compiler.ts#L70)

Logger for verbose/debug output

***

### prettier?

> `optional` **prettier?**: [`PrettierMarkdownOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/PrettierMarkdownOptions/index.md)

Defined in: [browser-compiler/src/compiler.ts:68](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/compiler.ts#L68)

Prettier formatting options for markdown output

***

### projectRoot?

> `optional` **projectRoot?**: `string`

Defined in: [browser-compiler/src/compiler.ts:74](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/compiler.ts#L74)

Virtual project root containing .promptscript/scripts.

***

### validator?

> `optional` **validator?**: [`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md)

Defined in: [browser-compiler/src/compiler.ts:62](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/browser-compiler/src/compiler.ts#L62)

Validator configuration