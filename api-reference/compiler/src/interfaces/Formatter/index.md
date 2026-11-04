# Formatter

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: Formatter

Defined in: [compiler/src/types.ts:79](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L79)

Interface for formatters that convert AST to target format.

## Extended by

- [`CanonicalFormatter`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CanonicalFormatter/index.md)

## Properties

### defaultConvention

> `readonly` **defaultConvention**: `string`

Defined in: [compiler/src/types.ts:87](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L87)

Default convention for this formatter

***

### description

> `readonly` **description**: `string`

Defined in: [compiler/src/types.ts:85](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L85)

Human-readable description

***

### name

> `readonly` **name**: `string`

Defined in: [compiler/src/types.ts:81](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L81)

Formatter name (e.g., "github", "claude", "cursor")

***

### outputPath

> `readonly` **outputPath**: `string`

Defined in: [compiler/src/types.ts:83](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L83)

Output path pattern

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

***

### formatCanonical()?

> `optional` **formatCanonical**(`ast`, `options?`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/FormatterOutput/index.md)

Defined in: [compiler/src/types.ts:91](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L91)

Optional canonical entry point for migrated formatters.

#### Parameters

##### ast

[`CanonicalProgram`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalProgram/index.md)

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/FormatOptions/index.md)

#### Returns

[`FormatterOutput`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/FormatterOutput/index.md)

***

### getSkillBasePath()

> **getSkillBasePath**(): `string` \| `null`

Defined in: [compiler/src/types.ts:93](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L93)

Base path for skills (e.g., '.claude/skills'), or null if no skill support

#### Returns

`string` \| `null`

***

### getSkillFileName()

> **getSkillFileName**(): `string` \| `null`

Defined in: [compiler/src/types.ts:95](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L95)

Skill file name (e.g., 'SKILL.md' or 'skill.md'), or null if no skill support

#### Returns

`string` \| `null`

***

### referencesMode()

> **referencesMode**(): `"none"` \| `"directory"` \| `"inline"`

Defined in: [compiler/src/types.ts:97](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/compiler/src/types.ts#L97)

How this formatter handles skill references: 'directory', 'inline', or 'none'

#### Returns

`"none"` \| `"directory"` \| `"inline"`

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