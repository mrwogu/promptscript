# CompilerOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CompilerOptions

Defined in: [compiler/src/types.ts:153](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/compiler/src/types.ts#L153)

Options for the compiler.

## Properties

### customConventions?

> `optional` **customConventions?**: `Record`\<`string`, [`OutputConvention`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputConvention/index.md)\>

Defined in: [compiler/src/types.ts:161](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/compiler/src/types.ts#L161)

Custom convention definitions

***

### formatters

> **formatters**: (`string` \| [`Formatter`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md) \| \{ `config?`: [`TargetConfig`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/TargetConfig/index.md); `name`: `string`; \})[]

Defined in: [compiler/src/types.ts:159](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/compiler/src/types.ts#L159)

Formatters to use (names, instances, or configs)

***

### ignoreHashes?

> `optional` **ignoreHashes?**: `boolean`

Defined in: [compiler/src/types.ts:179](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/compiler/src/types.ts#L179)

Skip reference integrity hash verification

***

### logger?

> `optional` **logger?**: [`Logger`](https://getpromptscript.dev/api-reference/core/src/interfaces/Logger/index.md)

Defined in: [compiler/src/types.ts:171](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/compiler/src/types.ts#L171)

Logger for verbose/debug output

***

### models?

> `optional` **models?**: [`ModelsConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelsConfig/index.md)

Defined in: [compiler/src/types.ts:169](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/compiler/src/types.ts#L169)

Model catalog settings (`models` in promptscript.yaml). Formatters use
them to map agent models; the validator uses them for PS041. When
`validator.models` is set, both use that instead.

***

### prettier?

> `optional` **prettier?**: [`PrettierMarkdownOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/PrettierMarkdownOptions/index.md)

Defined in: [compiler/src/types.ts:163](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/compiler/src/types.ts#L163)

Prettier formatting options for markdown output

***

### resolver

> **resolver**: [`ResolverOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md)

Defined in: [compiler/src/types.ts:155](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/compiler/src/types.ts#L155)

Resolver configuration

***

### skillContent?

> `optional` **skillContent?**: `string`

Defined in: [compiler/src/types.ts:177](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/compiler/src/types.ts#L177)

Content of the PromptScript SKILL.md to inject into compilation output.
When provided (and config doesn't disable it), this content is added
to each formatter's native skill directory.

***

### validator?

> `optional` **validator?**: [`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md)

Defined in: [compiler/src/types.ts:157](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/compiler/src/types.ts#L157)

Validator configuration