# PromptTextFormatter

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: PromptTextFormatter

Defined in: [formatters/src/formatters/prompt-text.ts:55](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/formatters/src/formatters/prompt-text.ts#L55)

Writes the composed system message of each prompt as Markdown, for reading.

Writes `prompts/<key>.md` for each prompt that has a system message and `prompts/README.md`
as the primary file. The text is the system message of the `bundle` target, and the hash
of that bundle sits in a comment at the top of each file. A prompt without a system message
is skipped with a diagnostic.

## Extends

- `PromptFormatter`

## Constructors

### Constructor

> **new PromptTextFormatter**(): `PromptTextFormatter`

Defined in: [formatters/src/formatters/prompt-text.ts:56](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/formatters/src/formatters/prompt-text.ts#L56)

#### Returns

`PromptTextFormatter`

#### Overrides

`PromptFormatter.constructor`

## Properties

### defaultConvention

> `readonly` **defaultConvention**: `"markdown"` = `'markdown'`

Defined in: [formatters/src/prompt/prompt-formatter.ts:68](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/formatters/src/prompt/prompt-formatter.ts#L68)

Default convention for this formatter

#### Inherited from

`PromptFormatter.defaultConvention`

***

### description

> `readonly` **description**: `string`

Defined in: [formatters/src/prompt/prompt-formatter.ts:73](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/formatters/src/prompt/prompt-formatter.ts#L73)

#### Inherited from

`PromptFormatter.description`

***

### name

> `readonly` **name**: `string`

Defined in: [formatters/src/prompt/prompt-formatter.ts:71](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/formatters/src/prompt/prompt-formatter.ts#L71)

#### Inherited from

`PromptFormatter.name`

***

### outputPath

> `readonly` **outputPath**: `string`

Defined in: [formatters/src/prompt/prompt-formatter.ts:72](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/formatters/src/prompt/prompt-formatter.ts#L72)

#### Inherited from

`PromptFormatter.outputPath`

## Methods

### format()

> **format**(`ast`, `options?`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

Defined in: [formatters/src/prompt/prompt-formatter.ts:78](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/formatters/src/prompt/prompt-formatter.ts#L78)

Transform AST to target format

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

[`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

#### Inherited from

`PromptFormatter.format`

***

### getSkillBasePath()

> **getSkillBasePath**(): `string` \| `null`

Defined in: [formatters/src/prompt/prompt-formatter.ts:120](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/formatters/src/prompt/prompt-formatter.ts#L120)

Base path for skills (e.g., '.claude/skills'), or null if no skill support

#### Returns

`string` \| `null`

#### Inherited from

`PromptFormatter.getSkillBasePath`

***

### getSkillFileName()

> **getSkillFileName**(): `string` \| `null`

Defined in: [formatters/src/prompt/prompt-formatter.ts:124](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/formatters/src/prompt/prompt-formatter.ts#L124)

Skill file name (e.g., 'SKILL.md' or 'skill.md'), or null if no skill support

#### Returns

`string` \| `null`

#### Inherited from

`PromptFormatter.getSkillFileName`

***

### referencesMode()

> **referencesMode**(): `"none"`

Defined in: [formatters/src/prompt/prompt-formatter.ts:128](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/formatters/src/prompt/prompt-formatter.ts#L128)

How this formatter handles skill references: 'directory', 'inline', or 'none'

#### Returns

`"none"`

#### Inherited from

`PromptFormatter.referencesMode`

***

### render()

> `protected` **render**(`built`): `PromptRender`

Defined in: [formatters/src/formatters/prompt-text.ts:64](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/formatters/src/formatters/prompt-text.ts#L64)

#### Parameters

##### built

`BuiltPrompts`

#### Returns

`PromptRender`

#### Overrides

`PromptFormatter.render`

***

### getSupportedVersions()

> `static` **getSupportedVersions**(): [`FormatterVersionMap`](https://getpromptscript.dev/api-reference/formatters/src/type-aliases/FormatterVersionMap/index.md)

Defined in: [formatters/src/formatters/prompt-text.ts:60](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/formatters/src/formatters/prompt-text.ts#L60)

#### Returns

[`FormatterVersionMap`](https://getpromptscript.dev/api-reference/formatters/src/type-aliases/FormatterVersionMap/index.md)