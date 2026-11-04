# CompilerOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CompilerOptions

Defined in: [compiler/src/types.ts:172](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/compiler/src/types.ts#L172)

Options for the compiler.

## Properties

### customConventions?

> `optional` **customConventions?**: `Record`\<`string`, [`OutputConvention`](https://getpromptscript.dev/api-reference/core/src/interfaces/OutputConvention/index.md)\>

Defined in: [compiler/src/types.ts:180](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/compiler/src/types.ts#L180)

Custom convention definitions

***

### formatters

> **formatters**: (`string` \| [`Formatter`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md) \| \{ `config?`: [`TargetConfig`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/TargetConfig/index.md); `name`: `string`; \})[]

Defined in: [compiler/src/types.ts:178](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/compiler/src/types.ts#L178)

Formatters to use (names, instances, or configs)

***

### ignoreHashes?

> `optional` **ignoreHashes?**: `boolean`

Defined in: [compiler/src/types.ts:198](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/compiler/src/types.ts#L198)

Skip reference integrity hash verification

***

### logger?

> `optional` **logger?**: [`Logger`](https://getpromptscript.dev/api-reference/core/src/interfaces/Logger/index.md)

Defined in: [compiler/src/types.ts:190](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/compiler/src/types.ts#L190)

Logger for verbose/debug output

***

### markers?

> `optional` **markers?**: [`MarkerMode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/MarkerMode/index.md)

Defined in: [compiler/src/types.ts:204](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/compiler/src/types.ts#L204)

How generated markdown files are marked (`output.markers` in
promptscript.yaml).

#### Default

```ts
'timestamp'
```

***

### models?

> `optional` **models?**: [`ModelsConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelsConfig/index.md)

Defined in: [compiler/src/types.ts:188](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/compiler/src/types.ts#L188)

Model catalog settings (`models` in promptscript.yaml). Formatters use
them to map agent models; the validator uses them for PS041. When
`validator.models` is set, both use that instead.

***

### prettier?

> `optional` **prettier?**: [`PrettierMarkdownOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/PrettierMarkdownOptions/index.md)

Defined in: [compiler/src/types.ts:182](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/compiler/src/types.ts#L182)

Prettier formatting options for markdown output

***

### resolver

> **resolver**: [`ResolverOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ResolverOptions/index.md)

Defined in: [compiler/src/types.ts:174](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/compiler/src/types.ts#L174)

Resolver configuration

***

### skillContent?

> `optional` **skillContent?**: `string`

Defined in: [compiler/src/types.ts:196](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/compiler/src/types.ts#L196)

Content of the PromptScript SKILL.md to inject into compilation output.
When provided (and config doesn't disable it), this content is added
to each formatter's native skill directory.

***

### validator?

> `optional` **validator?**: [`ValidatorConfig`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidatorConfig/index.md)

Defined in: [compiler/src/types.ts:176](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/compiler/src/types.ts#L176)

Validator configuration

***

### verbatimMarkdown?

> `optional` **verbatimMarkdown?**: `boolean`

Defined in: [compiler/src/types.ts:209](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/compiler/src/types.ts#L209)

Keep generated markdown as written: formatters skip their Prettier-style
normalization (`formatting.postFormat: false` in promptscript.yaml).