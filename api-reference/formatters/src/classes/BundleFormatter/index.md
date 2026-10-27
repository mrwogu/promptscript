# BundleFormatter

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: BundleFormatter

Defined in: [formatters/src/formatters/bundle.ts:26](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/formatters/bundle.ts#L26)

Compiles `@prompts` entries to portable, content-hashed JSON bundles.

Writes `prompts/<key>.json` for each prompt and `prompts/index.json` as the primary file.
Writes nothing for a program without prompts.

## Extends

- `PromptFormatter`

## Constructors

### Constructor

> **new BundleFormatter**(): `BundleFormatter`

Defined in: [formatters/src/formatters/bundle.ts:27](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/formatters/bundle.ts#L27)

#### Returns

`BundleFormatter`

#### Overrides

`PromptFormatter.constructor`

## Properties

### defaultConvention

> `readonly` **defaultConvention**: `"markdown"` = `'markdown'`

Defined in: [formatters/src/prompt/prompt-formatter.ts:68](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/prompt/prompt-formatter.ts#L68)

Default convention for this formatter

#### Inherited from

`PromptFormatter.defaultConvention`

***

### description

> `readonly` **description**: `string`

Defined in: [formatters/src/prompt/prompt-formatter.ts:73](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/prompt/prompt-formatter.ts#L73)

#### Inherited from

`PromptFormatter.description`

***

### name

> `readonly` **name**: `string`

Defined in: [formatters/src/prompt/prompt-formatter.ts:71](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/prompt/prompt-formatter.ts#L71)

#### Inherited from

`PromptFormatter.name`

***

### outputPath

> `readonly` **outputPath**: `string`

Defined in: [formatters/src/prompt/prompt-formatter.ts:72](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/prompt/prompt-formatter.ts#L72)

#### Inherited from

`PromptFormatter.outputPath`

## Methods

### format()

> **format**(`ast`, `options?`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

Defined in: [formatters/src/prompt/prompt-formatter.ts:78](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/prompt/prompt-formatter.ts#L78)

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

Defined in: [formatters/src/prompt/prompt-formatter.ts:120](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/prompt/prompt-formatter.ts#L120)

Base path for skills (e.g., '.claude/skills'), or null if no skill support

#### Returns

`string` \| `null`

#### Inherited from

`PromptFormatter.getSkillBasePath`

***

### getSkillFileName()

> **getSkillFileName**(): `string` \| `null`

Defined in: [formatters/src/prompt/prompt-formatter.ts:124](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/prompt/prompt-formatter.ts#L124)

Skill file name (e.g., 'SKILL.md' or 'skill.md'), or null if no skill support

#### Returns

`string` \| `null`

#### Inherited from

`PromptFormatter.getSkillFileName`

***

### referencesMode()

> **referencesMode**(): `"none"`

Defined in: [formatters/src/prompt/prompt-formatter.ts:128](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/prompt/prompt-formatter.ts#L128)

How this formatter handles skill references: 'directory', 'inline', or 'none'

#### Returns

`"none"`

#### Inherited from

`PromptFormatter.referencesMode`

***

### render()

> `protected` **render**(`built`): `PromptRender`

Defined in: [formatters/src/formatters/bundle.ts:35](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/formatters/bundle.ts#L35)

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

Defined in: [formatters/src/formatters/bundle.ts:31](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/formatters/bundle.ts#L31)

#### Returns

[`FormatterVersionMap`](https://getpromptscript.dev/api-reference/formatters/src/type-aliases/FormatterVersionMap/index.md)