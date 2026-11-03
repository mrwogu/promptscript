# CanonicalFormatter

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CanonicalFormatter

Defined in: [formatters/src/types.ts:144](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/types.ts#L144)

Formatter contract for implementations that consume the immutable AST.

## Extends

- [`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md)

## Properties

### defaultConvention

> `readonly` **defaultConvention**: `string`

Defined in: [formatters/src/types.ts:101](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/types.ts#L101)

Default convention for this formatter

#### Inherited from

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md).[`defaultConvention`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md#defaultconvention)

***

### description

> `readonly` **description**: `string`

Defined in: [formatters/src/types.ts:99](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/types.ts#L99)

Human-readable description

#### Inherited from

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md).[`description`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md#description)

***

### name

> `readonly` **name**: `string`

Defined in: [formatters/src/types.ts:95](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/types.ts#L95)

Unique formatter identifier

#### Inherited from

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md).[`name`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md#name)

***

### outputPath

> `readonly` **outputPath**: `string`

Defined in: [formatters/src/types.ts:97](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/types.ts#L97)

Default output file path

#### Inherited from

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md).[`outputPath`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md#outputpath)

## Methods

### format()

> **format**(`ast`, `options?`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

Defined in: [formatters/src/types.ts:103](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/types.ts#L103)

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

Defined in: [formatters/src/types.ts:145](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/types.ts#L145)

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

### getDotDir()?

> `optional` **getDotDir**(): `string` \| `null`

Defined in: [formatters/src/types.ts:120](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/types.ts#L120)

Dot directory of the target (e.g., '.claude'), used for the `{{prs.dotDir}}`
path token. Null or not implemented leaves the token as written.

#### Returns

`string` \| `null`

#### Inherited from

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md).[`getDotDir`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md#getdotdir)

***

### getSkillBasePath()

> **getSkillBasePath**(): `string` \| `null`

Defined in: [formatters/src/types.ts:113](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/types.ts#L113)

Base path for skills (e.g., '.claude/skills'), or null if no skill support

#### Returns

`string` \| `null`

#### Inherited from

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md).[`getSkillBasePath`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md#getskillbasepath)

***

### getSkillFileName()

> **getSkillFileName**(): `string` \| `null`

Defined in: [formatters/src/types.ts:115](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/types.ts#L115)

Skill file name (e.g., 'SKILL.md' or 'skill.md'), or null if no skill support

#### Returns

`string` \| `null`

#### Inherited from

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md).[`getSkillFileName`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md#getskillfilename)

***

### referencesMode()

> **referencesMode**(): `"none"` \| `"directory"` \| `"inline"`

Defined in: [formatters/src/types.ts:122](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/types.ts#L122)

How this formatter handles skill references: 'directory', 'inline', or 'none'

#### Returns

`"none"` \| `"directory"` \| `"inline"`

#### Inherited from

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md).[`referencesMode`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md#referencesmode)

***

### transformInjectedSkillContent()?

> `optional` **transformInjectedSkillContent**(`content`): `string`

Defined in: [formatters/src/types.ts:131](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/types.ts#L131)

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