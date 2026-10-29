# Formatter

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: Formatter

Defined in: [compiler/src/types.ts:78](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L78)

Interface for formatters that convert AST to target format.

## Extended by

- [`CanonicalFormatter`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/CanonicalFormatter/index.md)

## Properties

### defaultConvention

> `readonly` **defaultConvention**: `string`

Defined in: [compiler/src/types.ts:86](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L86)

Default convention for this formatter

***

### description

> `readonly` **description**: `string`

Defined in: [compiler/src/types.ts:84](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L84)

Human-readable description

***

### name

> `readonly` **name**: `string`

Defined in: [compiler/src/types.ts:80](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L80)

Formatter name (e.g., "github", "claude", "cursor")

***

### outputPath

> `readonly` **outputPath**: `string`

Defined in: [compiler/src/types.ts:82](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L82)

Output path pattern

## Methods

### format()

> **format**(`ast`, `options?`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/compiler/src/interfaces/FormatterOutput/index.md)

Defined in: [compiler/src/types.ts:88](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L88)

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

Defined in: [compiler/src/types.ts:90](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L90)

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

Defined in: [compiler/src/types.ts:92](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L92)

Base path for skills (e.g., '.claude/skills'), or null if no skill support

#### Returns

`string` \| `null`

***

### getSkillFileName()

> **getSkillFileName**(): `string` \| `null`

Defined in: [compiler/src/types.ts:94](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L94)

Skill file name (e.g., 'SKILL.md' or 'skill.md'), or null if no skill support

#### Returns

`string` \| `null`

***

### referencesMode()

> **referencesMode**(): `"none"` \| `"directory"` \| `"inline"`

Defined in: [compiler/src/types.ts:96](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L96)

How this formatter handles skill references: 'directory', 'inline', or 'none'

#### Returns

`"none"` \| `"directory"` \| `"inline"`

***

### transformInjectedSkillContent()?

> `optional` **transformInjectedSkillContent**(`content`): `string`

Defined in: [compiler/src/types.ts:103](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/compiler/src/types.ts#L103)

Optional hook to transform the raw content of a pass-through skill file
(e.g. the bundled PromptScript SKILL.md) before it is written. Formatters
whose target tools enforce frontmatter schemas can override this to strip
unsupported fields.

#### Parameters

##### content

`string`

#### Returns

`string`