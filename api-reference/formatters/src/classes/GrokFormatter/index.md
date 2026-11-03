# GrokFormatter

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: GrokFormatter

Defined in: [formatters/src/formatters/grok.ts:55](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/formatters/grok.ts#L55)

Grok Build formatter.

Generates primary `AGENTS.md` through shared Markdown instruction logic
and delegates compatible additional files to `ClaudeFormatter`.

Version behavior:
- `simple`: Root AGENTS.md only
- `multifile`: AGENTS.md, CLAUDE.md, Claude rules and commands
- `full`: AGENTS.md, CLAUDE.md, Claude rules, commands, skills, agents, and local memory

Grok is fully compatible with Claude Code with zero configuration, so
delegated files match Claude formatter output, except where
models.profiles gives the two targets different model names.

## Extends

- [`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md)

## Constructors

### Constructor

> **new GrokFormatter**(): `GrokFormatter`

#### Returns

`GrokFormatter`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`constructor`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#constructor)

## Properties

### defaultConvention

> `readonly` **defaultConvention**: `"markdown"` = `'markdown'`

Defined in: [formatters/src/formatters/grok.ts:59](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/formatters/grok.ts#L59)

Default convention for this formatter

#### Overrides

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`defaultConvention`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#defaultconvention)

***

### description

> `readonly` **description**: `"Grok Build instructions (AGENTS.md + Claude delegation)"` = `'Grok Build instructions (AGENTS.md + Claude delegation)'`

Defined in: [formatters/src/formatters/grok.ts:58](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/formatters/grok.ts#L58)

Human-readable description

#### Overrides

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`description`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#description)

***

### name

> `readonly` **name**: `"grok"` = `'grok'`

Defined in: [formatters/src/formatters/grok.ts:56](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/formatters/grok.ts#L56)

Unique formatter identifier

#### Overrides

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`name`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#name)

***

### outputPath

> `readonly` **outputPath**: `"AGENTS.md"` = `'AGENTS.md'`

Defined in: [formatters/src/formatters/grok.ts:57](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/formatters/grok.ts#L57)

Default output file path

#### Overrides

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`outputPath`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#outputpath)

***

### standardsExtractor

> `protected` `readonly` **standardsExtractor**: `StandardsExtractor`

Defined in: [formatters/src/base-formatter.ts:62](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L62)

Shared standards extractor for consistent extraction across all formatters.

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`standardsExtractor`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#standardsextractor)

***

### CONTEXT\_RENDERED\_KEYS

> `protected` `readonly` `static` **CONTEXT\_RENDERED\_KEYS**: `ReadonlySet`\<`string`\>

Defined in: [formatters/src/base-formatter.ts:288](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L288)

`@context` keys that already have a dedicated rendering path. Anything
outside this set is generic and must be surfaced by the context section.

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`CONTEXT_RENDERED_KEYS`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#context_rendered_keys)

## Methods

### appendGenericStandardItems()

> `protected` **appendGenericStandardItems**(`items`, `props`, `knownKeys`): `void`

Defined in: [formatters/src/base-formatter.ts:407](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L407)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`appendGenericStandardItems`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#appendgenericstandarditems)

***

### contextArchitectureProperty()

> `protected` **contextArchitectureProperty**(`ast`): `string` \| `null`

Defined in: [formatters/src/base-formatter.ts:308](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L308)

Read the `architecture` property of `@context`. Used as a fallback for
sources that declare architecture as a property rather than as an
`## Architecture` heading inside the block text.

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

#### Returns

`string` \| `null`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`contextArchitectureProperty`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#contextarchitectureproperty)

***

### contextPropertyItems()

> `protected` **contextPropertyItems**(`ast`, `alsoRenderedKeys?`): `string`[]

Defined in: [formatters/src/base-formatter.ts:321](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L321)

Render `@context` properties that no dedicated section consumes as
`Label: value` items, so structured context is never silently dropped.

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### alsoRenderedKeys?

readonly `string`[] = `[]`

#### Returns

`string`[]

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`contextPropertyItems`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#contextpropertyitems)

***

### contextTextConsumedByProject()

> `protected` **contextTextConsumedByProject**(`ast`): `boolean`

Defined in: [formatters/src/base-formatter.ts:274](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L274)

Whether the `@context` block's text is consumed by the project/intro
fallback. Must mirror the project() and intro() consumption conditions
exactly, otherwise the context section would either duplicate the text
(predicate too narrow) or drop it entirely (predicate too wide).

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

#### Returns

`boolean`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`contextTextConsumedByProject`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#contexttextconsumedbyproject)

***

### createRenderer()

> `protected` **createRenderer**(`options?`): [`ConventionRenderer`](https://getpromptscript.dev/api-reference/formatters/src/classes/ConventionRenderer/index.md)

Defined in: [formatters/src/base-formatter.ts:68](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L68)

Create a convention renderer for this formatter.
Uses the provided convention from options or falls back to the default.

#### Parameters

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

[`ConventionRenderer`](https://getpromptscript.dev/api-reference/formatters/src/classes/ConventionRenderer/index.md)

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`createRenderer`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#createrenderer)

***

### dedent()

> `protected` **dedent**(`text`): `string`

Defined in: [formatters/src/base-formatter.ts:863](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L863)

Remove common leading whitespace from all lines (dedent).
Handles the case where trim() was already called, causing the first line
to lose its indentation while subsequent lines retain theirs.
Calculates minimum indent from lines 2+ only.

#### Parameters

##### text

`string`

#### Returns

`string`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`dedent`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#dedent)

***

### documentationItem()

> `protected` **documentationItem**(`value`, `defaultText`): `string` \| `null`

Defined in: [formatters/src/base-formatter.ts:392](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L392)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`documentationItem`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#documentationitem)

***

### extractContextTechStackItems()

> `protected` **extractContextTechStackItems**(`props`): `string`[]

Defined in: [formatters/src/base-formatter.ts:354](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L354)

Collect `@context` tech-stack entries from every supported shape:
an explicit `techStack` list plus the `languages`/`runtime`/`monorepo`
properties.

#### Parameters

##### props

`Record`\<`string`, [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)\>

#### Returns

`string`[]

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`extractContextTechStackItems`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#extractcontexttechstackitems)

***

### extractExamples()

> `protected` **extractExamples**(`ast`): `object`[]

Defined in: [formatters/src/base-formatter.ts:1036](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L1036)

Extract examples from the

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

#### Returns

`object`[]

#### Examples

block.
Returns an array of example definitions with name, input, output, and optional description.

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`extractExamples`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#extractexamples)

***

### extractSectionWithCodeBlock()

> `protected` **extractSectionWithCodeBlock**(`text`, `header`): `string` \| `null`

Defined in: [formatters/src/base-formatter.ts:441](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L441)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`extractSectionWithCodeBlock`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#extractsectionwithcodeblock)

***

### extractSkillExamples()

> `protected` **extractSkillExamples**(`skillProps`): `object`[]

Defined in: [formatters/src/base-formatter.ts:1049](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L1049)

Extract examples from a skill's nested examples property.
Returns the same shape as extractExamples.

#### Parameters

##### skillProps

`Record`\<`string`, [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)\>

#### Returns

`object`[]

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`extractSkillExamples`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#extractskillexamples)

***

### extractSkills()

> `protected` **extractSkills**(`ast`, `options?`): `SkillFileConfig`[]

Defined in: [formatters/src/base-formatter.ts:1297](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L1297)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`extractSkills`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#extractskills)

***

### extractText()

> `protected` **extractText**(`content`): `string`

Defined in: [formatters/src/base-formatter.ts:104](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L104)

Extract text from block content.

#### Parameters

##### content

[`BlockContent`](https://getpromptscript.dev/api-reference/core/src/type-aliases/BlockContent/index.md)

#### Returns

`string`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`extractText`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#extracttext)

***

### findBlock()

> `protected` **findBlock**(`ast`, `name`): [`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md) \| `undefined`

Defined in: [formatters/src/base-formatter.ts:97](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L97)

Find a block by name, ignoring internal blocks (starting with __).

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### name

`string`

#### Returns

[`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md) \| `undefined`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`findBlock`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#findblock)

***

### format()

> **format**(`input`, `options?`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

Defined in: [formatters/src/formatters/grok.ts:81](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/formatters/grok.ts#L81)

Transform AST to target format

#### Parameters

##### input

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

[`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

#### Overrides

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`format`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#format)

***

### formatArray()

> `protected` **formatArray**(`arr`): `string`

Defined in: [formatters/src/base-formatter.ts:155](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L155)

Format an array as comma-separated string.

#### Parameters

##### arr

`unknown`[]

#### Returns

`string`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`formatArray`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#formatarray)

***

### formatCanonical()

> **formatCanonical**(`ast`, `options?`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

Defined in: [formatters/src/base-formatter.ts:41](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L41)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`formatCanonical`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#formatcanonical)

***

### formatStandardsList()

> `protected` **formatStandardsList**(`items`): `string`[]

Defined in: [formatters/src/base-formatter.ts:147](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L147)

Format standards list from array of values (pass-through).
Returns array of strings for rendering as bullet list.

#### Parameters

##### items

[`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)

#### Returns

`string`[]

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`formatStandardsList`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#formatstandardslist)

***

### generateSkillFile()

> `protected` **generateSkillFile**(`config`, `options?`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md) \| `null`

Defined in: [formatters/src/base-formatter.ts:1337](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L1337)

Render a skill file at the target's skill base path.
Returns null when the target declares no skill support.

#### Parameters

##### config

`SkillFileConfig`

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

[`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md) \| `null`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`generateSkillFile`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#generateskillfile)

***

### getArrayElements()

> `protected` **getArrayElements**(`content`): [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)[]

Defined in: [formatters/src/base-formatter.ts:179](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L179)

Extract array elements from block content.

#### Parameters

##### content

[`BlockContent`](https://getpromptscript.dev/api-reference/core/src/type-aliases/BlockContent/index.md)

#### Returns

[`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)[]

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`getArrayElements`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#getarrayelements)

***

### getBlockArrayElements()

> `protected` **getBlockArrayElements**(`block`): [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)[]

Defined in: [formatters/src/base-formatter.ts:202](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L202)

#### Parameters

##### block

[`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md)

#### Returns

[`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)[]

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`getBlockArrayElements`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#getblockarrayelements)

***

### getDotDir()

> **getDotDir**(): `string` \| `null`

Defined in: [formatters/src/base-formatter.ts:1110](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L1110)

Dot directory of the target, by default the parent of a `<dir>/skills`
skill base path, or null when there is none.

#### Returns

`string` \| `null`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`getDotDir`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#getdotdir)

***

### getMetaField()

> `protected` **getMetaField**(`ast`, `key`): `string` \| `undefined`

Defined in: [formatters/src/base-formatter.ts:169](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L169)

Get meta field value as string.

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### key

`string`

#### Returns

`string` \| `undefined`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`getMetaField`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#getmetafield)

***

### getNativeAgentName()

> `protected` **getNativeAgentName**(`ast`, `name`): `string`

Defined in: [formatters/src/base-formatter.ts:1183](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L1183)

Return the deterministic native identifier for one agent.

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### name

`string`

#### Returns

`string`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`getNativeAgentName`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#getnativeagentname)

***

### getNativeAgentNameMap()

> `protected` **getNativeAgentNameMap**(`ast`): `ReadonlyMap`\<`string`, `string`\>

Defined in: [formatters/src/base-formatter.ts:1173](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L1173)

Map all agent names consistently for a target's native files.

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

#### Returns

`ReadonlyMap`\<`string`, `string`\>

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`getNativeAgentNameMap`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#getnativeagentnamemap)

***

### getOutputPath()

> `protected` **getOutputPath**(`options?`): `string`

Defined in: [formatters/src/base-formatter.ts:90](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L90)

Get the output path, respecting options override.

#### Parameters

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

`string`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`getOutputPath`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#getoutputpath)

***

### getPrettierOptions()

> `protected` **getPrettierOptions**(`options?`): `Required`\<[`PrettierMarkdownOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/PrettierMarkdownOptions/index.md)\>

Defined in: [formatters/src/base-formatter.ts:80](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L80)

Get resolved Prettier options, merging provided options with defaults.

#### Parameters

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

`Required`\<[`PrettierMarkdownOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/PrettierMarkdownOptions/index.md)\>

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`getPrettierOptions`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#getprettieroptions)

***

### getProp()

> `protected` **getProp**(`content`, `key`): [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md) \| `undefined`

Defined in: [formatters/src/base-formatter.ts:118](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L118)

Get a specific property from block content.

#### Parameters

##### content

[`BlockContent`](https://getpromptscript.dev/api-reference/core/src/type-aliases/BlockContent/index.md)

##### key

`string`

#### Returns

[`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md) \| `undefined`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`getProp`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#getprop)

***

### getProps()

> `protected` **getProps**(`content`): `Record`\<`string`, [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)\>

Defined in: [formatters/src/base-formatter.ts:132](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L132)

Get all properties from block content.

#### Parameters

##### content

[`BlockContent`](https://getpromptscript.dev/api-reference/core/src/type-aliases/BlockContent/index.md)

#### Returns

`Record`\<`string`, [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)\>

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`getProps`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#getprops)

***

### getSkillBasePath()

> **getSkillBasePath**(): `string` \| `null`

Defined in: [formatters/src/formatters/grok.ts:67](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/formatters/grok.ts#L67)

Base path for skills, or null if formatter has no skill support.

#### Returns

`string` \| `null`

#### Overrides

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`getSkillBasePath`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#getskillbasepath)

***

### getSkillFileName()

> **getSkillFileName**(): `string` \| `null`

Defined in: [formatters/src/formatters/grok.ts:73](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/formatters/grok.ts#L73)

Skill file name, or null if formatter has no skill support.

#### Returns

`string` \| `null`

#### Overrides

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`getSkillFileName`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#getskillfilename)

***

### humanizeLabel()

> `protected` **humanizeLabel**(`value`): `string`

Defined in: [formatters/src/base-formatter.ts:427](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L427)

Convert a camelCase/kebab-case key into a human-readable label.

#### Parameters

##### value

`string`

#### Returns

`string`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`humanizeLabel`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#humanizelabel)

***

### isSafeAgentName()

> `protected` **isSafeAgentName**(`name`): `boolean`

Defined in: [formatters/src/base-formatter.ts:1166](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L1166)

Check if an agent name is safe for use in file paths.

#### Parameters

##### name

`string`

#### Returns

`boolean`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`isSafeAgentName`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#issafeagentname)

***

### isSafeName()

> `protected` **isSafeName**(`name`): `boolean`

Defined in: [formatters/src/base-formatter.ts:1146](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L1146)

Check if a name is safe for use in file paths.
Rejects path traversal sequences and path separators.

#### Parameters

##### name

`string`

#### Returns

`boolean`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`isSafeName`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#issafename)

***

### isSafeSkillName()

> `protected` **isSafeSkillName**(`name`): `boolean`

Defined in: [formatters/src/base-formatter.ts:1159](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L1159)

Check if a skill name is safe for use in file paths.

#### Parameters

##### name

`string`

#### Returns

`boolean`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`isSafeSkillName`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#issafeskillname)

***

### mergeRequiredSkillFrontmatter()

> `protected` **mergeRequiredSkillFrontmatter**(`rawFrontmatter`, `name`, `description`): `string`

Defined in: [formatters/src/base-formatter.ts:1265](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L1265)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`mergeRequiredSkillFrontmatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#mergerequiredskillfrontmatter)

***

### normalizeMarkdownForPrettier()

> `protected` **normalizeMarkdownForPrettier**(`content`): `string`

Defined in: [formatters/src/base-formatter.ts:501](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L501)

Normalize markdown content to match Prettier formatting.
- Strips common leading indentation from lines
- Trims trailing whitespace from lines
- Normalizes markdown table formatting
- Adds blank lines before lists when preceded by text
- Adds blank lines before code blocks when preceded by text
- Escapes markdown special characters in paths

The result must keep the meaning of the input: table cells, code spans
and list nesting (including tight lists) are never changed.

With `verbatimMarkdown` (`formatting.postFormat: false`) only the common
indentation is removed and the text stays as written.

#### Parameters

##### content

`string`

#### Returns

`string`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`normalizeMarkdownForPrettier`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#normalizemarkdownforprettier)

***

### normalizeOutputDir()

> `protected` **normalizeOutputDir**(`dir`): `string`

Defined in: [formatters/src/base-formatter.ts:896](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L896)

Normalize a user-provided output directory (from `@use ... into "<path>"`
or `skillTargets` config) to a safe forward-slash relative path. Rejects
`..`, `.` and leading slashes so the result can be appended to a target's
dot-directory without escaping it.

#### Parameters

##### dir

`string`

#### Returns

`string`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`normalizeOutputDir`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#normalizeoutputdir)

***

### normalizeResourcePath()

> `protected` **normalizeResourcePath**(`relativePath`): `string` \| `null`

Defined in: [formatters/src/base-formatter.ts:963](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L963)

Normalize a resource path to a safe, portable relative path.

#### Parameters

##### relativePath

`string`

#### Returns

`string` \| `null`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`normalizeResourcePath`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#normalizeresourcepath)

***

### referenceProvenance()

> `protected` **referenceProvenance**(`sourcePath`): `string`

Defined in: [formatters/src/base-formatter.ts:1138](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L1138)

Generate a provenance comment for a reference file.

#### Parameters

##### sourcePath

`string`

#### Returns

`string`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`referenceProvenance`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#referenceprovenance)

***

### referencesMode()

> **referencesMode**(): `"none"` \| `"directory"` \| `"inline"`

Defined in: [formatters/src/formatters/grok.ts:77](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/formatters/grok.ts#L77)

How this formatter handles skill references.
- 'directory': emit as separate files in references/ subdirectory
- 'inline': append as sections in the main output file
- 'none': references not supported

#### Returns

`"none"` \| `"directory"` \| `"inline"`

#### Overrides

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`referencesMode`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#referencesmode)

***

### removeRawFrontmatterKeys()

> `protected` **removeRawFrontmatterKeys**(`rawFrontmatter`, `keys`): `string`

Defined in: [formatters/src/base-formatter.ts:1233](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L1233)

Remove top-level keys (with their nested lines) from raw SKILL.md
frontmatter. Used for PromptScript-only keys such as `params`, which are
resolved at compile time and mean nothing to the target tool.

#### Parameters

##### rawFrontmatter

`string`

##### keys

`ReadonlySet`\<`string`\>

#### Returns

`string`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`removeRawFrontmatterKeys`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#removerawfrontmatterkeys)

***

### renderCodeFence()

> `protected` **renderCodeFence**(`content`, `lang?`): `string`

Defined in: [formatters/src/base-formatter.ts:1409](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L1409)

Render content inside a code fence, using a longer fence if the content
itself contains triple backticks (prevents code fence injection).

#### Parameters

##### content

`string`

##### lang?

`string` = `''`

#### Returns

`string`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`renderCodeFence`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#rendercodefence)

***

### renderExamplesSection()

> `protected` **renderExamplesSection**(`ast`, `renderer`, `sectionName?`): `string` \| `null`

Defined in: [formatters/src/base-formatter.ts:1065](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L1065)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`renderExamplesSection`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#renderexamplessection)

***

### resolveSkillDir()

> `protected` **resolveSkillDir**(`defaultSkillBasePath`, `skillName`, `outputDir?`, `options?`): `string`

Defined in: [formatters/src/base-formatter.ts:926](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L926)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`resolveSkillDir`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#resolveskilldir)

***

### sanitizeResourceFiles()

> `protected` **sanitizeResourceFiles**(`resources`, `targetDir`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)[]

Defined in: [formatters/src/base-formatter.ts:982](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L982)

Filter resource files to only include safe canonical paths.

#### Parameters

##### resources

`object`[] \| `undefined`

##### targetDir

`string`

#### Returns

[`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)[]

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`sanitizeResourceFiles`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#sanitizeresourcefiles)

***

### shiftContextHeadings()

> `protected` **shiftContextHeadings**(`text`): `string`

Defined in: [formatters/src/base-formatter.ts:846](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L846)

Shift

#### Parameters

##### text

`string`

#### Returns

`string`

#### Context

headings so none of them reaches the formatter's own h1
and h2 levels. All headings move by the same amount, so their relative
levels stay as written. Text that already starts at h3 or deeper is
kept as is.

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`shiftContextHeadings`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#shiftcontextheadings)

***

### shiftHeadingsToMinLevel()

> `protected` **shiftHeadingsToMinLevel**(`text`, `targetLevel`): `string`

Defined in: [formatters/src/base-formatter.ts:807](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L807)

Shift all ATX headings by the same amount so the shallowest heading lands
at targetLevel. Levels clamp to h1-h6 and fenced code blocks are ignored.

#### Parameters

##### text

`string`

##### targetLevel

`number`

#### Returns

`string`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`shiftHeadingsToMinLevel`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#shiftheadingstominlevel)

***

### shortcutSummary()

> `protected` **shortcutSummary**(`value`, `fallback?`): `string`

Defined in: [formatters/src/base-formatter.ts:249](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L249)

Extract a stable one-line summary from any supported shortcut value.

#### Parameters

##### value

[`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)

##### fallback?

`string` = `''`

#### Returns

`string`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`shortcutSummary`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#shortcutsummary)

***

### shouldIncludeSkill()

> `protected` **shouldIncludeSkill**(`name`, `options?`): `boolean`

Defined in: [formatters/src/base-formatter.ts:915](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L915)

Return true when the target configuration allows emitting the given skill.

#### Parameters

##### name

`string`

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

`boolean`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`shouldIncludeSkill`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#shouldincludeskill)

***

### startFormat()

> `protected` **startFormat**(`options?`): `void`

Defined in: [formatters/src/base-formatter.ts:55](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L55)

Call first in `format`, so markdown helpers know whether to keep the text
as written. The state is reset on every call.

#### Parameters

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

`void`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`startFormat`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#startformat)

***

### stripAllIndent()

> `protected` **stripAllIndent**(`content`): `string`

Defined in: [formatters/src/base-formatter.ts:673](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L673)

Strip all leading indentation from markdown content.
Used for AGENTS.md where content from multiple sources has inconsistent indentation.
Preserves indentation inside code blocks.

With `verbatimMarkdown` only the common indentation is removed.

#### Parameters

##### content

`string`

#### Returns

`string`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`stripAllIndent`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#stripallindent)

***

### transformInjectedSkillContent()

> **transformInjectedSkillContent**(`content`): `string`

Defined in: [formatters/src/base-formatter.ts:1131](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L1131)

Default pass-through for injected skill content. Formatters whose target
tools restrict skill frontmatter (e.g. Factory AI) override this hook to
filter unsupported fields before the compiler writes the file.

#### Parameters

##### content

`string`

#### Returns

`string`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`transformInjectedSkillContent`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#transforminjectedskillcontent)

***

### truncate()

> `protected` **truncate**(`str`, `max`): `string`

Defined in: [formatters/src/base-formatter.ts:162](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L162)

Truncate string to max length with ellipsis.

#### Parameters

##### str

`string`

##### max

`number`

#### Returns

`string`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`truncate`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#truncate)

***

### valueToString()

> `protected` **valueToString**(`value`): `string`

Defined in: [formatters/src/base-formatter.ts:229](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L229)

Convert value to string representation.

#### Parameters

##### value

[`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)

#### Returns

`string`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`valueToString`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#valuetostring)

***

### yamlQuoted()

> `protected` **yamlQuoted**(`value`): `string`

Defined in: [formatters/src/base-formatter.ts:299](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L299)

Escape a value for use inside a double-quoted YAML scalar.

#### Parameters

##### value

`string`

#### Returns

`string`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`yamlQuoted`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#yamlquoted)

***

### yamlString()

> `protected` **yamlString**(`value`): `string`

Defined in: [formatters/src/base-formatter.ts:1202](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/base-formatter.ts#L1202)

Serialize a string as a YAML scalar, quoting only when required.

#### Parameters

##### value

`string`

#### Returns

`string`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`yamlString`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#yamlstring)

***

### getSupportedVersions()

> `static` **getSupportedVersions**(): [`FormatterVersionMap`](https://getpromptscript.dev/api-reference/formatters/src/type-aliases/FormatterVersionMap/index.md)

Defined in: [formatters/src/formatters/grok.ts:63](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/formatters/grok.ts#L63)

#### Returns

[`FormatterVersionMap`](https://getpromptscript.dev/api-reference/formatters/src/type-aliases/FormatterVersionMap/index.md)