# BaseFormatter

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Abstract Class: BaseFormatter

Defined in: [formatters/src/base-formatter.ts:28](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L28)

Abstract base formatter with common helper methods.
Extend this class to create new formatter implementations.

## Extended by

- [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)
- [`GitHubFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/GitHubFormatter/index.md)
- [`ClaudeFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/ClaudeFormatter/index.md)
- [`CursorFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/CursorFormatter/index.md)
- [`AntigravityFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/AntigravityFormatter/index.md)
- [`GrokFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/GrokFormatter/index.md)

## Implements

- [`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md)

## Constructors

### Constructor

> **new BaseFormatter**(): `BaseFormatter`

#### Returns

`BaseFormatter`

## Properties

### defaultConvention

> `abstract` `readonly` **defaultConvention**: `string`

Defined in: [formatters/src/base-formatter.ts:32](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L32)

Default convention for this formatter

#### Implementation of

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md).[`defaultConvention`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md#defaultconvention)

***

### description

> `abstract` `readonly` **description**: `string`

Defined in: [formatters/src/base-formatter.ts:31](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L31)

Human-readable description

#### Implementation of

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md).[`description`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md#description)

***

### name

> `abstract` `readonly` **name**: `string`

Defined in: [formatters/src/base-formatter.ts:29](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L29)

Unique formatter identifier

#### Implementation of

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md).[`name`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md#name)

***

### outputPath

> `abstract` `readonly` **outputPath**: `string`

Defined in: [formatters/src/base-formatter.ts:30](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L30)

Default output file path

#### Implementation of

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md).[`outputPath`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md#outputpath)

***

### standardsExtractor

> `protected` `readonly` **standardsExtractor**: `StandardsExtractor`

Defined in: [formatters/src/base-formatter.ts:48](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L48)

Shared standards extractor for consistent extraction across all formatters.

***

### CONTEXT\_RENDERED\_KEYS

> `protected` `readonly` `static` **CONTEXT\_RENDERED\_KEYS**: `ReadonlySet`\<`string`\>

Defined in: [formatters/src/base-formatter.ts:273](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L273)

`@context` keys that already have a dedicated rendering path. Anything
outside this set is generic and must be surfaced by the context section.

## Methods

### appendGenericStandardItems()

> `protected` **appendGenericStandardItems**(`items`, `props`, `knownKeys`): `void`

Defined in: [formatters/src/base-formatter.ts:392](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L392)

Append generic `Label: value` items for standards keys not handled by
the known-key rendering in a section method. Keeps custom

#### Parameters

##### items

`string`[]

##### props

`Record`\<`string`, [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)\>

##### knownKeys

`ReadonlySet`\<`string`\>

#### Returns

`void`

#### Standards

keys (git/config/documentation/diagrams) visible in monolith output.
Skips null/undefined/false; renders bare labels for true.

***

### contextArchitectureProperty()

> `protected` **contextArchitectureProperty**(`ast`): `string` \| `null`

Defined in: [formatters/src/base-formatter.ts:293](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L293)

Read the `architecture` property of `@context`. Used as a fallback for
sources that declare architecture as a property rather than as an
`## Architecture` heading inside the block text.

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

#### Returns

`string` \| `null`

***

### contextPropertyItems()

> `protected` **contextPropertyItems**(`ast`, `alsoRenderedKeys?`): `string`[]

Defined in: [formatters/src/base-formatter.ts:306](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L306)

Render `@context` properties that no dedicated section consumes as
`Label: value` items, so structured context is never silently dropped.

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### alsoRenderedKeys?

readonly `string`[] = `[]`

#### Returns

`string`[]

***

### contextTextConsumedByProject()

> `protected` **contextTextConsumedByProject**(`ast`): `boolean`

Defined in: [formatters/src/base-formatter.ts:259](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L259)

Whether the `@context` block's text is consumed by the project/intro
fallback. Must mirror the project() and intro() consumption conditions
exactly, otherwise the context section would either duplicate the text
(predicate too narrow) or drop it entirely (predicate too wide).

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

#### Returns

`boolean`

***

### createRenderer()

> `protected` **createRenderer**(`options?`): [`ConventionRenderer`](https://getpromptscript.dev/api-reference/formatters/src/classes/ConventionRenderer/index.md)

Defined in: [formatters/src/base-formatter.ts:54](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L54)

Create a convention renderer for this formatter.
Uses the provided convention from options or falls back to the default.

#### Parameters

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

[`ConventionRenderer`](https://getpromptscript.dev/api-reference/formatters/src/classes/ConventionRenderer/index.md)

***

### dedent()

> `protected` **dedent**(`text`): `string`

Defined in: [formatters/src/base-formatter.ts:702](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L702)

Remove common leading whitespace from all lines (dedent).
Handles the case where trim() was already called, causing the first line
to lose its indentation while subsequent lines retain theirs.
Calculates minimum indent from lines 2+ only.

#### Parameters

##### text

`string`

#### Returns

`string`

***

### documentationItem()

> `protected` **documentationItem**(`value`, `defaultText`): `string` \| `null`

Defined in: [formatters/src/base-formatter.ts:377](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L377)

Resolve a documentation-standard entry that accepts either a boolean flag
or author-supplied prose. A string value is authoritative and replaces the
target's default phrasing, so authored text is never silently discarded.

#### Parameters

##### value

[`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md) \| `undefined`

##### defaultText

`string`

#### Returns

`string` \| `null`

***

### extractContextTechStackItems()

> `protected` **extractContextTechStackItems**(`props`): `string`[]

Defined in: [formatters/src/base-formatter.ts:339](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L339)

Collect `@context` tech-stack entries from every supported shape:
an explicit `techStack` list plus the `languages`/`runtime`/`monorepo`
properties.

#### Parameters

##### props

`Record`\<`string`, [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)\>

#### Returns

`string`[]

***

### extractExamples()

> `protected` **extractExamples**(`ast`): `object`[]

Defined in: [formatters/src/base-formatter.ts:875](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L875)

Extract examples from the

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

#### Returns

`object`[]

#### Examples

block.
Returns an array of example definitions with name, input, output, and optional description.

***

### extractSectionWithCodeBlock()

> `protected` **extractSectionWithCodeBlock**(`text`, `header`): `string` \| `null`

Defined in: [formatters/src/base-formatter.ts:426](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L426)

Safe extraction of a section that contains a header + content + code block + content
Avoids ReDoS by using string search instead of backtracking regex.
Matches pattern: Header ... ``` ... ```

#### Parameters

##### text

`string`

##### header

`string`

#### Returns

`string` \| `null`

***

### extractSkillExamples()

> `protected` **extractSkillExamples**(`skillProps`): `object`[]

Defined in: [formatters/src/base-formatter.ts:888](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L888)

Extract examples from a skill's nested examples property.
Returns the same shape as extractExamples.

#### Parameters

##### skillProps

`Record`\<`string`, [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)\>

#### Returns

`object`[]

***

### extractSkills()

> `protected` **extractSkills**(`ast`, `options?`): `SkillFileConfig`[]

Defined in: [formatters/src/base-formatter.ts:1092](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L1092)

Extract skills from the

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

`SkillFileConfig`[]

#### Skills

block, skipping unsafe names and skills
excluded by the target's skill filter.

***

### extractText()

> `protected` **extractText**(`content`): `string`

Defined in: [formatters/src/base-formatter.ts:89](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L89)

Extract text from block content.

#### Parameters

##### content

[`BlockContent`](https://getpromptscript.dev/api-reference/core/src/type-aliases/BlockContent/index.md)

#### Returns

`string`

***

### findBlock()

> `protected` **findBlock**(`ast`, `name`): [`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md) \| `undefined`

Defined in: [formatters/src/base-formatter.ts:82](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L82)

Find a block by name, ignoring internal blocks (starting with __).

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### name

`string`

#### Returns

[`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md) \| `undefined`

***

### format()

> `abstract` **format**(`ast`, `options?`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

Defined in: [formatters/src/base-formatter.ts:33](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L33)

Transform AST to target format

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

[`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

#### Implementation of

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md).[`format`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md#format)

***

### formatArray()

> `protected` **formatArray**(`arr`): `string`

Defined in: [formatters/src/base-formatter.ts:140](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L140)

Format an array as comma-separated string.

#### Parameters

##### arr

`unknown`[]

#### Returns

`string`

***

### formatCanonical()

> **formatCanonical**(`ast`, `options?`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

Defined in: [formatters/src/base-formatter.ts:41](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L41)

Canonical entry point for legacy implementations.

Subclasses can override this method to consume ordered canonical entries
directly. Until then, keep the compatibility projection isolated here.

#### Parameters

##### ast

[`CanonicalProgram`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalProgram/index.md)

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

[`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

#### Implementation of

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md).[`formatCanonical`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md#formatcanonical)

***

### formatStandardsList()

> `protected` **formatStandardsList**(`items`): `string`[]

Defined in: [formatters/src/base-formatter.ts:132](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L132)

Format standards list from array of values (pass-through).
Returns array of strings for rendering as bullet list.

#### Parameters

##### items

[`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)

#### Returns

`string`[]

***

### generateSkillFile()

> `protected` **generateSkillFile**(`config`, `options?`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md) \| `null`

Defined in: [formatters/src/base-formatter.ts:1132](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L1132)

Render a skill file at the target's skill base path.
Returns null when the target declares no skill support.

#### Parameters

##### config

`SkillFileConfig`

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

[`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md) \| `null`

***

### getArrayElements()

> `protected` **getArrayElements**(`content`): [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)[]

Defined in: [formatters/src/base-formatter.ts:164](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L164)

Extract array elements from block content.

#### Parameters

##### content

[`BlockContent`](https://getpromptscript.dev/api-reference/core/src/type-aliases/BlockContent/index.md)

#### Returns

[`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)[]

***

### getBlockArrayElements()

> `protected` **getBlockArrayElements**(`block`): [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)[]

Defined in: [formatters/src/base-formatter.ts:187](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L187)

#### Parameters

##### block

[`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md)

#### Returns

[`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)[]

***

### getMetaField()

> `protected` **getMetaField**(`ast`, `key`): `string` \| `undefined`

Defined in: [formatters/src/base-formatter.ts:154](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L154)

Get meta field value as string.

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### key

`string`

#### Returns

`string` \| `undefined`

***

### getNativeAgentName()

> `protected` **getNativeAgentName**(`ast`, `name`): `string`

Defined in: [formatters/src/base-formatter.ts:1012](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L1012)

Return the deterministic native identifier for one agent.

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### name

`string`

#### Returns

`string`

***

### getNativeAgentNameMap()

> `protected` **getNativeAgentNameMap**(`ast`): `ReadonlyMap`\<`string`, `string`\>

Defined in: [formatters/src/base-formatter.ts:1002](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L1002)

Map all agent names consistently for a target's native files.

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

#### Returns

`ReadonlyMap`\<`string`, `string`\>

***

### getOutputPath()

> `protected` **getOutputPath**(`options?`): `string`

Defined in: [formatters/src/base-formatter.ts:75](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L75)

Get the output path, respecting options override.

#### Parameters

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

`string`

***

### getPrettierOptions()

> `protected` **getPrettierOptions**(`options?`): `Required`\<[`PrettierMarkdownOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/PrettierMarkdownOptions/index.md)\>

Defined in: [formatters/src/base-formatter.ts:65](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L65)

Get resolved Prettier options, merging provided options with defaults.

#### Parameters

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

`Required`\<[`PrettierMarkdownOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/PrettierMarkdownOptions/index.md)\>

***

### getProp()

> `protected` **getProp**(`content`, `key`): [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md) \| `undefined`

Defined in: [formatters/src/base-formatter.ts:103](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L103)

Get a specific property from block content.

#### Parameters

##### content

[`BlockContent`](https://getpromptscript.dev/api-reference/core/src/type-aliases/BlockContent/index.md)

##### key

`string`

#### Returns

[`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md) \| `undefined`

***

### getProps()

> `protected` **getProps**(`content`): `Record`\<`string`, [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)\>

Defined in: [formatters/src/base-formatter.ts:117](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L117)

Get all properties from block content.

#### Parameters

##### content

[`BlockContent`](https://getpromptscript.dev/api-reference/core/src/type-aliases/BlockContent/index.md)

#### Returns

`Record`\<`string`, [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)\>

***

### getSkillBasePath()

> **getSkillBasePath**(): `string` \| `null`

Defined in: [formatters/src/base-formatter.ts:936](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L936)

Base path for skills, or null if formatter has no skill support.

#### Returns

`string` \| `null`

#### Implementation of

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md).[`getSkillBasePath`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md#getskillbasepath)

***

### getSkillFileName()

> **getSkillFileName**(): `string` \| `null`

Defined in: [formatters/src/base-formatter.ts:941](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L941)

Skill file name, or null if formatter has no skill support.

#### Returns

`string` \| `null`

#### Implementation of

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md).[`getSkillFileName`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md#getskillfilename)

***

### humanizeLabel()

> `protected` **humanizeLabel**(`value`): `string`

Defined in: [formatters/src/base-formatter.ts:412](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L412)

Convert a camelCase/kebab-case key into a human-readable label.

#### Parameters

##### value

`string`

#### Returns

`string`

***

### isSafeAgentName()

> `protected` **isSafeAgentName**(`name`): `boolean`

Defined in: [formatters/src/base-formatter.ts:995](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L995)

Check if an agent name is safe for use in file paths.

#### Parameters

##### name

`string`

#### Returns

`boolean`

***

### isSafeName()

> `protected` **isSafeName**(`name`): `boolean`

Defined in: [formatters/src/base-formatter.ts:975](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L975)

Check if a name is safe for use in file paths.
Rejects path traversal sequences and path separators.

#### Parameters

##### name

`string`

#### Returns

`boolean`

***

### isSafeSkillName()

> `protected` **isSafeSkillName**(`name`): `boolean`

Defined in: [formatters/src/base-formatter.ts:988](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L988)

Check if a skill name is safe for use in file paths.

#### Parameters

##### name

`string`

#### Returns

`boolean`

***

### mergeRequiredSkillFrontmatter()

> `protected` **mergeRequiredSkillFrontmatter**(`rawFrontmatter`, `name`, `description`): `string`

Defined in: [formatters/src/base-formatter.ts:1060](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L1060)

Preserve raw skill frontmatter while supplying mandatory skill fields.

#### Parameters

##### rawFrontmatter

`string`

##### name

`string`

##### description

`string`

#### Returns

`string`

***

### normalizeMarkdownForPrettier()

> `protected` **normalizeMarkdownForPrettier**(`content`): `string`

Defined in: [formatters/src/base-formatter.ts:454](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L454)

Normalize markdown content to match Prettier formatting.
- Strips common leading indentation from lines
- Trims trailing whitespace from lines
- Normalizes markdown table formatting
- Adds blank lines before lists when preceded by text
- Adds blank lines before code blocks when preceded by text
- Escapes markdown special characters in paths

#### Parameters

##### content

`string`

#### Returns

`string`

***

### normalizeOutputDir()

> `protected` **normalizeOutputDir**(`dir`): `string`

Defined in: [formatters/src/base-formatter.ts:735](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L735)

Normalize a user-provided output directory (from `@use ... into "<path>"`
or `skillTargets` config) to a safe forward-slash relative path. Rejects
`..`, `.` and leading slashes so the result can be appended to a target's
dot-directory without escaping it.

#### Parameters

##### dir

`string`

#### Returns

`string`

***

### normalizeResourcePath()

> `protected` **normalizeResourcePath**(`relativePath`): `string` \| `null`

Defined in: [formatters/src/base-formatter.ts:802](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L802)

Normalize a resource path to a safe, portable relative path.

#### Parameters

##### relativePath

`string`

#### Returns

`string` \| `null`

***

### referenceProvenance()

> `protected` **referenceProvenance**(`sourcePath`): `string`

Defined in: [formatters/src/base-formatter.ts:967](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L967)

Generate a provenance comment for a reference file.

#### Parameters

##### sourcePath

`string`

#### Returns

`string`

***

### referencesMode()

> **referencesMode**(): `"none"` \| `"directory"` \| `"inline"`

Defined in: [formatters/src/base-formatter.ts:951](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L951)

How this formatter handles skill references.
- 'directory': emit as separate files in references/ subdirectory
- 'inline': append as sections in the main output file
- 'none': references not supported

#### Returns

`"none"` \| `"directory"` \| `"inline"`

#### Implementation of

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md).[`referencesMode`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md#referencesmode)

***

### renderCodeFence()

> `protected` **renderCodeFence**(`content`, `lang?`): `string`

Defined in: [formatters/src/base-formatter.ts:1204](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L1204)

Render content inside a code fence, using a longer fence if the content
itself contains triple backticks (prevents code fence injection).

#### Parameters

##### content

`string`

##### lang?

`string` = `''`

#### Returns

`string`

***

### renderExamplesSection()

> `protected` **renderExamplesSection**(`ast`, `renderer`, `sectionName?`): `string` \| `null`

Defined in: [formatters/src/base-formatter.ts:904](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L904)

Render an examples section from the

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### renderer

[`ConventionRenderer`](https://getpromptscript.dev/api-reference/formatters/src/classes/ConventionRenderer/index.md)

##### sectionName?

`string` = `'Examples'`

Custom section heading name (default: 'Examples')

#### Returns

`string` \| `null`

#### Examples

block.
Shared rendering logic used by Claude, GitHub, and MarkdownInstructionFormatter.

***

### resolveSkillDir()

> `protected` **resolveSkillDir**(`defaultSkillBasePath`, `skillName`, `outputDir?`, `options?`): `string`

Defined in: [formatters/src/base-formatter.ts:765](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L765)

Resolve the directory for a generated skill, respecting per-target skill
base overrides while preserving existing `@use ... into` behavior.

#### Parameters

##### defaultSkillBasePath

`string`

##### skillName

`string`

##### outputDir?

`string`

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

`string`

***

### sanitizeResourceFiles()

> `protected` **sanitizeResourceFiles**(`resources`, `targetDir`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)[]

Defined in: [formatters/src/base-formatter.ts:821](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L821)

Filter resource files to only include safe canonical paths.

#### Parameters

##### resources

`object`[] \| `undefined`

##### targetDir

`string`

#### Returns

[`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)[]

***

### shortcutSummary()

> `protected` **shortcutSummary**(`value`, `fallback?`): `string`

Defined in: [formatters/src/base-formatter.ts:234](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L234)

Extract a stable one-line summary from any supported shortcut value.

#### Parameters

##### value

[`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)

##### fallback?

`string` = `''`

#### Returns

`string`

***

### shouldIncludeSkill()

> `protected` **shouldIncludeSkill**(`name`, `options?`): `boolean`

Defined in: [formatters/src/base-formatter.ts:754](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L754)

Return true when the target configuration allows emitting the given skill.

#### Parameters

##### name

`string`

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

`boolean`

***

### stripAllIndent()

> `protected` **stripAllIndent**(`content`): `string`

Defined in: [formatters/src/base-formatter.ts:598](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L598)

Strip all leading indentation from markdown content.
Used for AGENTS.md where content from multiple sources has inconsistent indentation.
Preserves indentation inside code blocks.

#### Parameters

##### content

`string`

#### Returns

`string`

***

### transformInjectedSkillContent()

> **transformInjectedSkillContent**(`content`): `string`

Defined in: [formatters/src/base-formatter.ts:960](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L960)

Default pass-through for injected skill content. Formatters whose target
tools restrict skill frontmatter (e.g. Factory AI) override this hook to
filter unsupported fields before the compiler writes the file.

#### Parameters

##### content

`string`

#### Returns

`string`

#### Implementation of

[`Formatter`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md).[`transformInjectedSkillContent`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/Formatter/index.md#transforminjectedskillcontent)

***

### truncate()

> `protected` **truncate**(`str`, `max`): `string`

Defined in: [formatters/src/base-formatter.ts:147](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L147)

Truncate string to max length with ellipsis.

#### Parameters

##### str

`string`

##### max

`number`

#### Returns

`string`

***

### valueToString()

> `protected` **valueToString**(`value`): `string`

Defined in: [formatters/src/base-formatter.ts:214](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L214)

Convert value to string representation.

#### Parameters

##### value

[`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)

#### Returns

`string`

***

### yamlQuoted()

> `protected` **yamlQuoted**(`value`): `string`

Defined in: [formatters/src/base-formatter.ts:284](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L284)

Escape a value for use inside a double-quoted YAML scalar.

#### Parameters

##### value

`string`

#### Returns

`string`

***

### yamlString()

> `protected` **yamlString**(`value`): `string`

Defined in: [formatters/src/base-formatter.ts:1031](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L1031)

Serialize a string as a YAML scalar, quoting only when required.

#### Parameters

##### value

`string`

#### Returns

`string`