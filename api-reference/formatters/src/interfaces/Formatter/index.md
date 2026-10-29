# Formatter

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: Formatter

Defined in: [formatters/src/types.ts:87](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/types.ts#L87)

Common interface for all formatters.

## Extended by

- [`CanonicalFormatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/CanonicalFormatter/index.md)

## Properties

### defaultConvention

> `readonly` **defaultConvention**: `string`

Defined in: [formatters/src/types.ts:95](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/types.ts#L95)

Default convention for this formatter

***

### description

> `readonly` **description**: `string`

Defined in: [formatters/src/types.ts:93](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/types.ts#L93)

Human-readable description

***

### name

> `readonly` **name**: `string`

Defined in: [formatters/src/types.ts:89](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/types.ts#L89)

Unique formatter identifier

***

### outputPath

> `readonly` **outputPath**: `string`

Defined in: [formatters/src/types.ts:91](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/types.ts#L91)

Default output file path

## Methods

### format()

> **format**(`ast`, `options?`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

Defined in: [formatters/src/types.ts:97](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/types.ts#L97)

Transform AST to target format

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

[`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

***

### formatCanonical()?

> `optional` **formatCanonical**(`ast`, `options?`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

Defined in: [formatters/src/types.ts:105](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/types.ts#L105)

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

***

### getSkillBasePath()

> **getSkillBasePath**(): `string` \| `null`

Defined in: [formatters/src/types.ts:107](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/types.ts#L107)

Base path for skills (e.g., '.claude/skills'), or null if no skill support

#### Returns

`string` \| `null`

***

### getSkillFileName()

> **getSkillFileName**(): `string` \| `null`

Defined in: [formatters/src/types.ts:109](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/types.ts#L109)

Skill file name (e.g., 'SKILL.md' or 'skill.md'), or null if no skill support

#### Returns

`string` \| `null`

***

### referencesMode()

> **referencesMode**(): `"none"` \| `"directory"` \| `"inline"`

Defined in: [formatters/src/types.ts:111](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/types.ts#L111)

How this formatter handles skill references: 'directory', 'inline', or 'none'

#### Returns

`"none"` \| `"directory"` \| `"inline"`

***

### transformInjectedSkillContent()?

> `optional` **transformInjectedSkillContent**(`content`): `string`

Defined in: [formatters/src/types.ts:120](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/types.ts#L120)

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