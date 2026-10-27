# CompilerOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CompilerOptions

Defined in: [compiler/src/types.ts:163](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/compiler/src/types.ts#L163)

Options for the compiler.

## Properties

### customConventions?

> `optional` **customConventions?**: `Record`\<`string`, [`OutputConvention`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputConvention/index.md)\>

Defined in: [compiler/src/types.ts:171](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/compiler/src/types.ts#L171)

Custom convention definitions

***

### formatters

> **formatters**: (`string` \| [`Formatter`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md) \| \{ `config?`: [`TargetConfig`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/TargetConfig/index.md); `name`: `string`; \})[]

Defined in: [compiler/src/types.ts:169](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/compiler/src/types.ts#L169)

Formatters to use (names, instances, or configs)

***

### ignoreHashes?

> `optional` **ignoreHashes?**: `boolean`

Defined in: [compiler/src/types.ts:189](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/compiler/src/types.ts#L189)

Skip reference integrity hash verification

***

### logger?

> `optional` **logger?**: [`Logger`](https://getpromptscript.dev/api-reference/core/src/interfaces/Logger/index.md)

Defined in: [compiler/src/types.ts:181](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/compiler/src/types.ts#L181)

Logger for verbose/debug output

***

### models?

> `optional` **models?**: [`ModelsConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelsConfig/index.md)

Defined in: [compiler/src/types.ts:179](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/compiler/src/types.ts#L179)

Model catalog settings (`models` in promptscript.yaml). Formatters use
them to map agent models; the validator uses them for PS041. When
`validator.models` is set, both use that instead.

***

### prettier?

> `optional` **prettier?**: [`PrettierMarkdownOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/PrettierMarkdownOptions/index.md)

Defined in: [compiler/src/types.ts:173](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/compiler/src/types.ts#L173)

Prettier formatting options for markdown output

***

### resolver

> **resolver**: [`ResolverOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md)

Defined in: [compiler/src/types.ts:165](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/compiler/src/types.ts#L165)

Resolver configuration

***

### skillContent?

> `optional` **skillContent?**: `string`

Defined in: [compiler/src/types.ts:187](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/compiler/src/types.ts#L187)

Content of the PromptScript SKILL.md to inject into compilation output.
When provided (and config doesn't disable it), this content is added
to each formatter's native skill directory.

***

### validator?

> `optional` **validator?**: [`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md)

Defined in: [compiler/src/types.ts:167](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/compiler/src/types.ts#L167)

Validator configuration