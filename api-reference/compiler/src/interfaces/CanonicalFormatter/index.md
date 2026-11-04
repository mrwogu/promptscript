# CanonicalFormatter

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CanonicalFormatter

Defined in: [compiler/src/types.ts:115](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L115)

Canonical formatter contract for immutable pipeline consumers.

## Extends

- [`Formatter`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md)

## Properties

### defaultConvention

> `readonly` **defaultConvention**: `string`

Defined in: [compiler/src/types.ts:87](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L87)

Default convention for this formatter

#### Inherited from

[`Formatter`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md).[`defaultConvention`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md#defaultconvention)

***

### description

> `readonly` **description**: `string`

Defined in: [compiler/src/types.ts:85](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L85)

Human-readable description

#### Inherited from

[`Formatter`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md).[`description`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md#description)

***

### name

> `readonly` **name**: `string`

Defined in: [compiler/src/types.ts:81](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L81)

Formatter name (e.g., "github", "claude", "cursor")

#### Inherited from

[`Formatter`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md).[`name`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md#name)

***

### outputPath

> `readonly` **outputPath**: `string`

Defined in: [compiler/src/types.ts:83](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L83)

Output path pattern

#### Inherited from

[`Formatter`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md).[`outputPath`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md#outputpath)

## Methods

### format()

> **format**(`ast`, `options?`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/FormatterOutput/index.md)

Defined in: [compiler/src/types.ts:89](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L89)

Format the AST to target format

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/FormatOptions/index.md)

#### Returns

[`FormatterOutput`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/FormatterOutput/index.md)

#### Inherited from

[`Formatter`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md).[`format`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md#format)

***

### formatCanonical()

> **formatCanonical**(`ast`, `options?`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/FormatterOutput/index.md)

Defined in: [compiler/src/types.ts:116](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L116)

Optional canonical entry point for migrated formatters.

#### Parameters

##### ast

[`CanonicalProgram`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalProgram/index.md)

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/FormatOptions/index.md)

#### Returns

[`FormatterOutput`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/FormatterOutput/index.md)

#### Overrides

[`Formatter`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md).[`formatCanonical`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md#formatcanonical)

***

### getSkillBasePath()

> **getSkillBasePath**(): `string` \| `null`

Defined in: [compiler/src/types.ts:93](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L93)

Base path for skills (e.g., '.claude/skills'), or null if no skill support

#### Returns

`string` \| `null`

#### Inherited from

[`Formatter`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md).[`getSkillBasePath`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md#getskillbasepath)

***

### getSkillFileName()

> **getSkillFileName**(): `string` \| `null`

Defined in: [compiler/src/types.ts:95](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L95)

Skill file name (e.g., 'SKILL.md' or 'skill.md'), or null if no skill support

#### Returns

`string` \| `null`

#### Inherited from

[`Formatter`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md).[`getSkillFileName`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md#getskillfilename)

***

### referencesMode()

> **referencesMode**(): `"none"` \| `"directory"` \| `"inline"`

Defined in: [compiler/src/types.ts:97](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L97)

How this formatter handles skill references: 'directory', 'inline', or 'none'

#### Returns

`"none"` \| `"directory"` \| `"inline"`

#### Inherited from

[`Formatter`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md).[`referencesMode`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md#referencesmode)

***

### transformInjectedSkillContent()?

> `optional` **transformInjectedSkillContent**(`content`): `string`

Defined in: [compiler/src/types.ts:104](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L104)

Optional hook to transform the raw content of a pass-through skill file
(e.g. the bundled PromptScript SKILL.md) before it is written. Formatters
whose target tools enforce frontmatter schemas can override this to strip
unsupported fields.

#### Parameters

##### content

`string`

#### Returns

`string`

#### Inherited from

[`Formatter`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md).[`transformInjectedSkillContent`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/Formatter/index.md#transforminjectedskillcontent)