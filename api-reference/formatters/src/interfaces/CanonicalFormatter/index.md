# CanonicalFormatter

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CanonicalFormatter

Defined in: [formatters/src/types.ts:133](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/formatters/src/types.ts#L133)

Formatter contract for implementations that consume the immutable AST.

## Extends

- [`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md)

## Properties

### defaultConvention

> `readonly` **defaultConvention**: `string`

Defined in: [formatters/src/types.ts:95](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/formatters/src/types.ts#L95)

Default convention for this formatter

#### Inherited from

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md).[`defaultConvention`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md#defaultconvention)

***

### description

> `readonly` **description**: `string`

Defined in: [formatters/src/types.ts:93](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/formatters/src/types.ts#L93)

Human-readable description

#### Inherited from

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md).[`description`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md#description)

***

### name

> `readonly` **name**: `string`

Defined in: [formatters/src/types.ts:89](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/formatters/src/types.ts#L89)

Unique formatter identifier

#### Inherited from

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md).[`name`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md#name)

***

### outputPath

> `readonly` **outputPath**: `string`

Defined in: [formatters/src/types.ts:91](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/formatters/src/types.ts#L91)

Default output file path

#### Inherited from

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md).[`outputPath`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md#outputpath)

## Methods

### format()

> **format**(`ast`, `options?`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

Defined in: [formatters/src/types.ts:97](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/formatters/src/types.ts#L97)

Transform AST to target format

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

[`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

#### Inherited from

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md).[`format`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md#format)

***

### formatCanonical()

> **formatCanonical**(`ast`, `options?`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

Defined in: [formatters/src/types.ts:134](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/formatters/src/types.ts#L134)

Optional canonical entry point.

Implementations that do not provide this method are legacy formatters.
The formatter adapter creates a detached compatibility projection before
invoking their `format` method.

#### Parameters

##### ast

[`CanonicalProgram`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalProgram/index.md)

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

[`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

#### Overrides

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md).[`formatCanonical`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md#formatcanonical)

***

### getSkillBasePath()

> **getSkillBasePath**(): `string` \| `null`

Defined in: [formatters/src/types.ts:107](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/formatters/src/types.ts#L107)

Base path for skills (e.g., '.claude/skills'), or null if no skill support

#### Returns

`string` \| `null`

#### Inherited from

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md).[`getSkillBasePath`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md#getskillbasepath)

***

### getSkillFileName()

> **getSkillFileName**(): `string` \| `null`

Defined in: [formatters/src/types.ts:109](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/formatters/src/types.ts#L109)

Skill file name (e.g., 'SKILL.md' or 'skill.md'), or null if no skill support

#### Returns

`string` \| `null`

#### Inherited from

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md).[`getSkillFileName`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md#getskillfilename)

***

### referencesMode()

> **referencesMode**(): `"none"` \| `"directory"` \| `"inline"`

Defined in: [formatters/src/types.ts:111](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/formatters/src/types.ts#L111)

How this formatter handles skill references: 'directory', 'inline', or 'none'

#### Returns

`"none"` \| `"directory"` \| `"inline"`

#### Inherited from

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md).[`referencesMode`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md#referencesmode)

***

### transformInjectedSkillContent()?

> `optional` **transformInjectedSkillContent**(`content`): `string`

Defined in: [formatters/src/types.ts:120](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/formatters/src/types.ts#L120)

Transform the raw content of a pass-through skill file (e.g. the bundled
PromptScript SKILL.md injected by the compiler) before it is written to
disk. Formatters whose target tools enforce frontmatter schemas (such as
Factory AI) can override this to strip unsupported fields.

Defaults to identity when not implemented.

#### Parameters

##### content

`string`

#### Returns

`string`

#### Inherited from

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md).[`transformInjectedSkillContent`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md#transforminjectedskillcontent)