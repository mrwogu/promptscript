# TraeFormatter

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: TraeFormatter

Defined in: [formatters/src/formatters/trae.ts:32](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/formatters/trae.ts#L32)

Abstract base class for markdown-based instruction formatters.

Provides shared section extraction logic (project, tech stack, architecture,
code standards, git commits, config files, commands, post-work, documentation,
diagrams, restrictions) and standard simple/multifile/full mode implementations.

Subclasses configure behavior via `MarkdownFormatterConfig` and can override
specific methods for format-specific customization.

## Extends

- [`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md)

## Constructors

### Constructor

> **new TraeFormatter**(): `TraeFormatter`

Defined in: [formatters/src/formatters/trae.ts:33](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/formatters/trae.ts#L33)

#### Returns

`TraeFormatter`

#### Overrides

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`constructor`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#constructor)

## Properties

### config

> `protected` `readonly` **config**: [`MarkdownFormatterConfig`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/MarkdownFormatterConfig/index.md)

Defined in: [formatters/src/markdown-instruction-formatter.ts:163](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L163)

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`config`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#config)

***

### defaultConvention

> `readonly` **defaultConvention**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:161](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L161)

Default convention for this formatter

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`defaultConvention`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#defaultconvention)

***

### description

> `readonly` **description**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:160](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L160)

Human-readable description

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`description`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#description)

***

### name

> `readonly` **name**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:158](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L158)

Unique formatter identifier

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`name`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#name)

***

### outputPath

> `readonly` **outputPath**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:159](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L159)

Default output file path

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`outputPath`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#outputpath)

***

### standardsExtractor

> `protected` `readonly` **standardsExtractor**: `StandardsExtractor`

Defined in: [formatters/src/base-formatter.ts:62](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L62)

Shared standards extractor for consistent extraction across all formatters.

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`standardsExtractor`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#standardsextractor)

***

### CONTEXT\_RENDERED\_KEYS

> `protected` `readonly` `static` **CONTEXT\_RENDERED\_KEYS**: `ReadonlySet`\<`string`\>

Defined in: [formatters/src/base-formatter.ts:288](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L288)

`@context` keys that already have a dedicated rendering path. Anything
outside this set is generic and must be surfaced by the context section.

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`CONTEXT_RENDERED_KEYS`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#context_rendered_keys)

## Methods

### addCommonSections()

> `protected` **addCommonSections**(`ast`, `renderer`, `sections`): `void`

Defined in: [formatters/src/markdown-instruction-formatter.ts:645](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L645)

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### renderer

[`ConventionRenderer`](https://getpromptscript.dev/api-reference/formatters/src/classes/ConventionRenderer/index.md)

##### sections

`string`[]

#### Returns

`void`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`addCommonSections`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#addcommonsections)

***

### addSection()

> `protected` **addSection**(`sections`, `content`): `void`

Defined in: [formatters/src/markdown-instruction-formatter.ts:666](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L666)

#### Parameters

##### sections

`string`[]

##### content

`string` \| `null`

#### Returns

`void`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`addSection`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#addsection)

***

### appendGenericStandardItems()

> `protected` **appendGenericStandardItems**(`items`, `props`, `knownKeys`): `void`

Defined in: [formatters/src/base-formatter.ts:407](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L407)

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

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`appendGenericStandardItems`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#appendgenericstandarditems)

***

### architecture()

> `protected` **architecture**(`ast`, `renderer`): `string` \| `null`

Defined in: [formatters/src/markdown-instruction-formatter.ts:761](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L761)

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### renderer

[`ConventionRenderer`](https://getpromptscript.dev/api-reference/formatters/src/classes/ConventionRenderer/index.md)

#### Returns

`string` \| `null`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`architecture`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#architecture)

***

### codeStandards()

> `protected` **codeStandards**(`ast`, `renderer`): `string` \| `null`

Defined in: [formatters/src/markdown-instruction-formatter.ts:831](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L831)

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### renderer

[`ConventionRenderer`](https://getpromptscript.dev/api-reference/formatters/src/classes/ConventionRenderer/index.md)

#### Returns

`string` \| `null`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`codeStandards`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#codestandards)

***

### commands()

> `protected` **commands**(`ast`, `renderer`): `string` \| `null`

Defined in: [formatters/src/markdown-instruction-formatter.ts:900](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L900)

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### renderer

[`ConventionRenderer`](https://getpromptscript.dev/api-reference/formatters/src/classes/ConventionRenderer/index.md)

#### Returns

`string` \| `null`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`commands`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#commands)

***

### configFiles()

> `protected` **configFiles**(`ast`, `renderer`): `string` \| `null`

Defined in: [formatters/src/markdown-instruction-formatter.ts:877](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L877)

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### renderer

[`ConventionRenderer`](https://getpromptscript.dev/api-reference/formatters/src/classes/ConventionRenderer/index.md)

#### Returns

`string` \| `null`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`configFiles`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#configfiles)

***

### context()

> `protected` **context**(`ast`, `renderer`): `string` \| `null`

Defined in: [formatters/src/markdown-instruction-formatter.ts:798](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L798)

Render

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### renderer

[`ConventionRenderer`](https://getpromptscript.dev/api-reference/formatters/src/classes/ConventionRenderer/index.md)

#### Returns

`string` \| `null`

#### Context

block text content as a "## Context" section.

The "## Architecture" subsection (with code block) is stripped because
it is already rendered separately by [architecture](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#architecture). Remaining
headings are shifted below h2, keeping their relative levels, to avoid clashing with the
formatter's own h2 section headings. When no

#### Identity

block exists,
the project() fallback already consumes the full

#### Context

text, so only
the generic properties are rendered to avoid duplication.

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`context`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#context)

***

### contextArchitectureProperty()

> `protected` **contextArchitectureProperty**(`ast`): `string` \| `null`

Defined in: [formatters/src/base-formatter.ts:308](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L308)

Read the `architecture` property of `@context`. Used as a fallback for
sources that declare architecture as a property rather than as an
`## Architecture` heading inside the block text.

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

#### Returns

`string` \| `null`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`contextArchitectureProperty`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#contextarchitectureproperty)

***

### contextPropertyItems()

> `protected` **contextPropertyItems**(`ast`, `alsoRenderedKeys?`): `string`[]

Defined in: [formatters/src/base-formatter.ts:321](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L321)

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

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`contextPropertyItems`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#contextpropertyitems)

***

### contextTextConsumedByProject()

> `protected` **contextTextConsumedByProject**(`ast`): `boolean`

Defined in: [formatters/src/base-formatter.ts:274](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L274)

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

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`contextTextConsumedByProject`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#contexttextconsumedbyproject)

***

### createRenderer()

> `protected` **createRenderer**(`options?`): [`ConventionRenderer`](https://getpromptscript.dev/api-reference/formatters/src/classes/ConventionRenderer/index.md)

Defined in: [formatters/src/base-formatter.ts:68](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L68)

Create a convention renderer for this formatter.
Uses the provided convention from options or falls back to the default.

#### Parameters

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

[`ConventionRenderer`](https://getpromptscript.dev/api-reference/formatters/src/classes/ConventionRenderer/index.md)

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`createRenderer`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#createrenderer)

***

### dedent()

> `protected` **dedent**(`text`): `string`

Defined in: [formatters/src/base-formatter.ts:863](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L863)

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

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`dedent`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#dedent)

***

### diagrams()

> `protected` **diagrams**(`ast`, `renderer`): `string` \| `null`

Defined in: [formatters/src/markdown-instruction-formatter.ts:994](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L994)

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### renderer

[`ConventionRenderer`](https://getpromptscript.dev/api-reference/formatters/src/classes/ConventionRenderer/index.md)

#### Returns

`string` \| `null`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`diagrams`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#diagrams)

***

### documentation()

> `protected` **documentation**(`ast`, `renderer`): `string` \| `null`

Defined in: [formatters/src/markdown-instruction-formatter.ts:963](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L963)

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### renderer

[`ConventionRenderer`](https://getpromptscript.dev/api-reference/formatters/src/classes/ConventionRenderer/index.md)

#### Returns

`string` \| `null`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`documentation`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#documentation)

***

### documentationItem()

> `protected` **documentationItem**(`value`, `defaultText`): `string` \| `null`

Defined in: [formatters/src/base-formatter.ts:392](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L392)

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

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`documentationItem`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#documentationitem)

***

### examples()

> `protected` **examples**(`ast`, `renderer`): `string` \| `null`

Defined in: [formatters/src/markdown-instruction-formatter.ts:1083](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L1083)

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### renderer

[`ConventionRenderer`](https://getpromptscript.dev/api-reference/formatters/src/classes/ConventionRenderer/index.md)

#### Returns

`string` \| `null`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`examples`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#examples)

***

### extractAgents()

> `protected` **extractAgents**(`ast`, `_options?`): [`MarkdownAgentConfig`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/MarkdownAgentConfig/index.md)[]

Defined in: [formatters/src/markdown-instruction-formatter.ts:584](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L584)

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### \_options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

[`MarkdownAgentConfig`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/MarkdownAgentConfig/index.md)[]

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`extractAgents`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#extractagents)

***

### extractCommands()

> `protected` **extractCommands**(`ast`): [`MarkdownCommandConfig`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/MarkdownCommandConfig/index.md)[]

Defined in: [formatters/src/markdown-instruction-formatter.ts:510](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L510)

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

#### Returns

[`MarkdownCommandConfig`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/MarkdownCommandConfig/index.md)[]

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`extractCommands`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#extractcommands)

***

### extractContextTechStackItems()

> `protected` **extractContextTechStackItems**(`props`): `string`[]

Defined in: [formatters/src/base-formatter.ts:354](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L354)

Collect `@context` tech-stack entries from every supported shape:
an explicit `techStack` list plus the `languages`/`runtime`/`monorepo`
properties.

#### Parameters

##### props

`Record`\<`string`, [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)\>

#### Returns

`string`[]

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`extractContextTechStackItems`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#extractcontexttechstackitems)

***

### extractExamples()

> `protected` **extractExamples**(`ast`): `object`[]

Defined in: [formatters/src/base-formatter.ts:1036](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L1036)

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

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`extractExamples`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#extractexamples)

***

### extractRestrictionsItems()

> `protected` **extractRestrictionsItems**(`block`): `string`[]

Defined in: [formatters/src/markdown-instruction-formatter.ts:1091](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L1091)

#### Parameters

##### block

[`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md)

#### Returns

`string`[]

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`extractRestrictionsItems`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#extractrestrictionsitems)

***

### extractSectionWithCodeBlock()

> `protected` **extractSectionWithCodeBlock**(`text`, `header`): `string` \| `null`

Defined in: [formatters/src/base-formatter.ts:441](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L441)

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

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`extractSectionWithCodeBlock`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#extractsectionwithcodeblock)

***

### extractSkillExamples()

> `protected` **extractSkillExamples**(`skillProps`): `object`[]

Defined in: [formatters/src/base-formatter.ts:1049](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L1049)

Extract examples from a skill's nested examples property.
Returns the same shape as extractExamples.

#### Parameters

##### skillProps

`Record`\<`string`, [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)\>

#### Returns

`object`[]

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`extractSkillExamples`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#extractskillexamples)

***

### extractSkills()

> `protected` **extractSkills**(`ast`, `options?`): `SkillFileConfig`[]

Defined in: [formatters/src/base-formatter.ts:1297](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L1297)

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

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`extractSkills`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#extractskills)

***

### extractTechStackFromContext()

> `protected` **extractTechStackFromContext**(`context`): `string`[]

Defined in: [formatters/src/markdown-instruction-formatter.ts:740](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L740)

#### Parameters

##### context

[`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md) \| `undefined`

#### Returns

`string`[]

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`extractTechStackFromContext`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#extracttechstackfromcontext)

***

### extractTechStackFromStandards()

> `protected` **extractTechStackFromStandards**(`standards`): `string`[]

Defined in: [formatters/src/markdown-instruction-formatter.ts:745](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L745)

#### Parameters

##### standards

[`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md) \| `undefined`

#### Returns

`string`[]

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`extractTechStackFromStandards`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#extracttechstackfromstandards)

***

### extractText()

> `protected` **extractText**(`content`): `string`

Defined in: [formatters/src/base-formatter.ts:104](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L104)

Extract text from block content.

#### Parameters

##### content

[`BlockContent`](https://getpromptscript.dev/api-reference/core/src/type-aliases/BlockContent/index.md)

#### Returns

`string`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`extractText`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#extracttext)

***

### findBlock()

> `protected` **findBlock**(`ast`, `name`): [`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md) \| `undefined`

Defined in: [formatters/src/base-formatter.ts:97](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L97)

Find a block by name, ignoring internal blocks (starting with __).

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### name

`string`

#### Returns

[`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md) \| `undefined`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`findBlock`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#findblock)

***

### format()

> **format**(`input`, `options?`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

Defined in: [formatters/src/markdown-instruction-formatter.ts:192](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L192)

Transform AST to target format

#### Parameters

##### input

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

[`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`format`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#format)

***

### formatArray()

> `protected` **formatArray**(`arr`): `string`

Defined in: [formatters/src/base-formatter.ts:155](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L155)

Format an array as comma-separated string.

#### Parameters

##### arr

`unknown`[]

#### Returns

`string`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`formatArray`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#formatarray)

***

### formatCanonical()

> **formatCanonical**(`ast`, `options?`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

Defined in: [formatters/src/base-formatter.ts:41](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L41)

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

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`formatCanonical`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#formatcanonical)

***

### formatFull()

> `protected` **formatFull**(`ast`, `options?`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

Defined in: [formatters/src/formatters/trae.ts:60](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/formatters/trae.ts#L60)

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

[`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

#### Overrides

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`formatFull`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#formatfull)

***

### formatMultifile()

> `protected` **formatMultifile**(`ast`, `options?`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

Defined in: [formatters/src/formatters/trae.ts:56](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/formatters/trae.ts#L56)

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

[`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

#### Overrides

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`formatMultifile`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#formatmultifile)

***

### formatSimple()

> `protected` **formatSimple**(`ast`, `options?`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

Defined in: [formatters/src/formatters/trae.ts:52](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/formatters/trae.ts#L52)

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

[`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

#### Overrides

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`formatSimple`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#formatsimple)

***

### formatStandardsList()

> `protected` **formatStandardsList**(`items`): `string`[]

Defined in: [formatters/src/base-formatter.ts:147](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L147)

Format standards list from array of values (pass-through).
Returns array of strings for rendering as bullet list.

#### Parameters

##### items

[`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)

#### Returns

`string`[]

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`formatStandardsList`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#formatstandardslist)

***

### generateAgentFile()

> `protected` **generateAgentFile**(`config`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

Defined in: [formatters/src/markdown-instruction-formatter.ts:619](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L619)

#### Parameters

##### config

[`MarkdownAgentConfig`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/MarkdownAgentConfig/index.md)

#### Returns

[`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`generateAgentFile`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#generateagentfile)

***

### generateCommandFile()

> `protected` **generateCommandFile**(`config`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

Defined in: [formatters/src/markdown-instruction-formatter.ts:553](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L553)

#### Parameters

##### config

[`MarkdownCommandConfig`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/MarkdownCommandConfig/index.md)

#### Returns

[`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`generateCommandFile`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#generatecommandfile)

***

### generateFrontmatter()

> `protected` **generateFrontmatter**(`_ast`, `_options?`): `string` \| `undefined`

Defined in: [formatters/src/markdown-instruction-formatter.ts:470](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L470)

#### Parameters

##### \_ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### \_options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

`string` \| `undefined`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`generateFrontmatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#generatefrontmatter)

***

### generateMcpConfig()

> `protected` **generateMcpConfig**(`ast`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md) \| `undefined`

Defined in: [formatters/src/markdown-instruction-formatter.ts:447](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L447)

Generate MCP config file from

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

#### Returns

[`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md) \| `undefined`

#### Mcp Servers

block if configured.
Returns FormatterOutput or undefined if no MCP block or no config path.

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`generateMcpConfig`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#generatemcpconfig)

***

### generateSkillFile()

> `protected` **generateSkillFile**(`config`, `options?`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md) \| `null`

Defined in: [formatters/src/base-formatter.ts:1337](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L1337)

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

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`generateSkillFile`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#generateskillfile)

***

### getArrayElements()

> `protected` **getArrayElements**(`content`): [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)[]

Defined in: [formatters/src/base-formatter.ts:179](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L179)

Extract array elements from block content.

#### Parameters

##### content

[`BlockContent`](https://getpromptscript.dev/api-reference/core/src/type-aliases/BlockContent/index.md)

#### Returns

[`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)[]

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`getArrayElements`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#getarrayelements)

***

### getBlockArrayElements()

> `protected` **getBlockArrayElements**(`block`): [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)[]

Defined in: [formatters/src/base-formatter.ts:202](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L202)

#### Parameters

##### block

[`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md)

#### Returns

[`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)[]

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`getBlockArrayElements`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#getblockarrayelements)

***

### getDotDir()

> **getDotDir**(): `string` \| `null`

Defined in: [formatters/src/markdown-instruction-formatter.ts:184](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L184)

Dot directory of the target, by default the parent of a `<dir>/skills`
skill base path, or null when there is none.

#### Returns

`string` \| `null`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`getDotDir`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#getdotdir)

***

### getMetaField()

> `protected` **getMetaField**(`ast`, `key`): `string` \| `undefined`

Defined in: [formatters/src/base-formatter.ts:169](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L169)

Get meta field value as string.

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### key

`string`

#### Returns

`string` \| `undefined`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`getMetaField`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#getmetafield)

***

### getNativeAgentName()

> `protected` **getNativeAgentName**(`ast`, `name`): `string`

Defined in: [formatters/src/base-formatter.ts:1183](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L1183)

Return the deterministic native identifier for one agent.

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### name

`string`

#### Returns

`string`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`getNativeAgentName`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#getnativeagentname)

***

### getNativeAgentNameMap()

> `protected` **getNativeAgentNameMap**(`ast`): `ReadonlyMap`\<`string`, `string`\>

Defined in: [formatters/src/base-formatter.ts:1173](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L1173)

Map all agent names consistently for a target's native files.

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

#### Returns

`ReadonlyMap`\<`string`, `string`\>

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`getNativeAgentNameMap`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#getnativeagentnamemap)

***

### getOutputPath()

> `protected` **getOutputPath**(`options?`): `string`

Defined in: [formatters/src/base-formatter.ts:90](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L90)

Get the output path, respecting options override.

#### Parameters

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

`string`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`getOutputPath`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#getoutputpath)

***

### getPrettierOptions()

> `protected` **getPrettierOptions**(`options?`): `Required`\<[`PrettierMarkdownOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/PrettierMarkdownOptions/index.md)\>

Defined in: [formatters/src/base-formatter.ts:80](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L80)

Get resolved Prettier options, merging provided options with defaults.

#### Parameters

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

`Required`\<[`PrettierMarkdownOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/PrettierMarkdownOptions/index.md)\>

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`getPrettierOptions`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#getprettieroptions)

***

### getProp()

> `protected` **getProp**(`content`, `key`): [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md) \| `undefined`

Defined in: [formatters/src/base-formatter.ts:118](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L118)

Get a specific property from block content.

#### Parameters

##### content

[`BlockContent`](https://getpromptscript.dev/api-reference/core/src/type-aliases/BlockContent/index.md)

##### key

`string`

#### Returns

[`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md) \| `undefined`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`getProp`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#getprop)

***

### getProps()

> `protected` **getProps**(`content`): `Record`\<`string`, [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)\>

Defined in: [formatters/src/base-formatter.ts:132](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L132)

Get all properties from block content.

#### Parameters

##### content

[`BlockContent`](https://getpromptscript.dev/api-reference/core/src/type-aliases/BlockContent/index.md)

#### Returns

`Record`\<`string`, [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)\>

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`getProps`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#getprops)

***

### getRenderedSectionName()

> `protected` **getRenderedSectionName**(`ast`, `key`, `renderer`, `defaultTitle?`): `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:485](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L485)

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### key

[`SectionNameKey`](https://getpromptscript.dev/api-reference/formatters/src/type-aliases/SectionNameKey/index.md)

##### renderer

[`ConventionRenderer`](https://getpromptscript.dev/api-reference/formatters/src/classes/ConventionRenderer/index.md)

##### defaultTitle?

`string`

#### Returns

`string`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`getRenderedSectionName`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#getrenderedsectionname)

***

### getSectionName()

> `protected` **getSectionName**(`ast`, `key`, `defaultTitle?`): `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:478](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L478)

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### key

[`SectionNameKey`](https://getpromptscript.dev/api-reference/formatters/src/type-aliases/SectionNameKey/index.md)

##### defaultTitle?

`string`

#### Returns

`string`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`getSectionName`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#getsectionname)

***

### getSkillBasePath()

> **getSkillBasePath**(): `string` \| `null`

Defined in: [formatters/src/markdown-instruction-formatter.ts:174](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L174)

Base path for skills, or null if formatter has no skill support.

#### Returns

`string` \| `null`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`getSkillBasePath`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#getskillbasepath)

***

### getSkillFileName()

> **getSkillFileName**(): `string` \| `null`

Defined in: [formatters/src/markdown-instruction-formatter.ts:179](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L179)

Skill file name, or null if formatter has no skill support.

#### Returns

`string` \| `null`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`getSkillFileName`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#getskillfilename)

***

### getUnsupportedBlockSuggestion()

> `protected` **getUnsupportedBlockSuggestion**(`blockName`): `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:278](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L278)

Provide a safe migration path for an omitted block.

#### Parameters

##### blockName

`string`

#### Returns

`string`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`getUnsupportedBlockSuggestion`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#getunsupportedblocksuggestion)

***

### getUnsupportedBlockWarnings()

> `protected` **getUnsupportedBlockWarnings**(`ast`, `skippedBlocks?`): [`FormatterWarning`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterWarning/index.md)[]

Defined in: [formatters/src/markdown-instruction-formatter.ts:249](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L249)

Report blocks that have no verified project-local output contract.
Native target files are never invented for these blocks.

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### skippedBlocks?

`ReadonlySet`\<`string`\> = `...`

#### Returns

[`FormatterWarning`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterWarning/index.md)[]

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`getUnsupportedBlockWarnings`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#getunsupportedblockwarnings)

***

### gitCommits()

> `protected` **gitCommits**(`ast`, `renderer`): `string` \| `null`

Defined in: [formatters/src/markdown-instruction-formatter.ts:850](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L850)

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### renderer

[`ConventionRenderer`](https://getpromptscript.dev/api-reference/formatters/src/classes/ConventionRenderer/index.md)

#### Returns

`string` \| `null`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`gitCommits`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#gitcommits)

***

### hasEnabledHooks()

> `protected` **hasEnabledHooks**(`ast`): `boolean`

Defined in: [formatters/src/markdown-instruction-formatter.ts:233](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L233)

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

#### Returns

`boolean`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`hasEnabledHooks`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#hasenabledhooks)

***

### humanizeLabel()

> `protected` **humanizeLabel**(`value`): `string`

Defined in: [formatters/src/base-formatter.ts:427](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L427)

Convert a camelCase/kebab-case key into a human-readable label.

#### Parameters

##### value

`string`

#### Returns

`string`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`humanizeLabel`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#humanizelabel)

***

### isBlockUnsupported()

> `protected` **isBlockUnsupported**(`blockName`): `boolean`

Defined in: [formatters/src/markdown-instruction-formatter.ts:941](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L941)

#### Parameters

##### blockName

`string`

#### Returns

`boolean`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`isBlockUnsupported`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#isblockunsupported)

***

### isSafeAgentName()

> `protected` **isSafeAgentName**(`name`): `boolean`

Defined in: [formatters/src/base-formatter.ts:1166](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L1166)

Check if an agent name is safe for use in file paths.

#### Parameters

##### name

`string`

#### Returns

`boolean`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`isSafeAgentName`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#issafeagentname)

***

### isSafeName()

> `protected` **isSafeName**(`name`): `boolean`

Defined in: [formatters/src/base-formatter.ts:1146](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L1146)

Check if a name is safe for use in file paths.
Rejects path traversal sequences and path separators.

#### Parameters

##### name

`string`

#### Returns

`boolean`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`isSafeName`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#issafename)

***

### isSafeSkillName()

> `protected` **isSafeSkillName**(`name`): `boolean`

Defined in: [formatters/src/base-formatter.ts:1159](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L1159)

Check if a skill name is safe for use in file paths.

#### Parameters

##### name

`string`

#### Returns

`boolean`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`isSafeSkillName`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#issafeskillname)

***

### knowledgeContent()

> `protected` **knowledgeContent**(`ast`, `renderer`, `includeResolvedTitle?`): `string` \| `null`

Defined in: [formatters/src/markdown-instruction-formatter.ts:1023](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L1023)

Render remaining

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### renderer

[`ConventionRenderer`](https://getpromptscript.dev/api-reference/formatters/src/classes/ConventionRenderer/index.md)

##### includeResolvedTitle?

`boolean` = `true`

#### Returns

`string` \| `null`

#### Knowledge

text content that isn't consumed by other sections.
Strips "## Development Commands" and "## Post-Work Verification" sub-sections
since those are already rendered by commands() and postWork().

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`knowledgeContent`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#knowledgecontent)

***

### mergeRequiredSkillFrontmatter()

> `protected` **mergeRequiredSkillFrontmatter**(`rawFrontmatter`, `name`, `description`): `string`

Defined in: [formatters/src/base-formatter.ts:1265](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L1265)

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

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`mergeRequiredSkillFrontmatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#mergerequiredskillfrontmatter)

***

### normalizeMarkdownForPrettier()

> `protected` **normalizeMarkdownForPrettier**(`content`): `string`

Defined in: [formatters/src/base-formatter.ts:501](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L501)

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

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`normalizeMarkdownForPrettier`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#normalizemarkdownforprettier)

***

### normalizeOutputDir()

> `protected` **normalizeOutputDir**(`dir`): `string`

Defined in: [formatters/src/base-formatter.ts:896](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L896)

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

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`normalizeOutputDir`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#normalizeoutputdir)

***

### normalizeResourcePath()

> `protected` **normalizeResourcePath**(`relativePath`): `string` \| `null`

Defined in: [formatters/src/base-formatter.ts:963](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L963)

Normalize a resource path to a safe, portable relative path.

#### Parameters

##### relativePath

`string`

#### Returns

`string` \| `null`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`normalizeResourcePath`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#normalizeresourcepath)

***

### postWork()

> `protected` **postWork**(`ast`, `renderer`): `string` \| `null`

Defined in: [formatters/src/markdown-instruction-formatter.ts:945](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L945)

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### renderer

[`ConventionRenderer`](https://getpromptscript.dev/api-reference/formatters/src/classes/ConventionRenderer/index.md)

#### Returns

`string` \| `null`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`postWork`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#postwork)

***

### project()

> `protected` **project**(`ast`, `renderer`): `string` \| `null`

Defined in: [formatters/src/markdown-instruction-formatter.ts:670](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L670)

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### renderer

[`ConventionRenderer`](https://getpromptscript.dev/api-reference/formatters/src/classes/ConventionRenderer/index.md)

#### Returns

`string` \| `null`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`project`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#project)

***

### referenceProvenance()

> `protected` **referenceProvenance**(`sourcePath`): `string`

Defined in: [formatters/src/base-formatter.ts:1138](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L1138)

Generate a provenance comment for a reference file.

#### Parameters

##### sourcePath

`string`

#### Returns

`string`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`referenceProvenance`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#referenceprovenance)

***

### referencesMode()

> **referencesMode**(): `"none"` \| `"directory"` \| `"inline"`

Defined in: [formatters/src/markdown-instruction-formatter.ts:188](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L188)

How this formatter handles skill references.
- 'directory': emit as separate files in references/ subdirectory
- 'inline': append as sections in the main output file
- 'none': references not supported

#### Returns

`"none"` \| `"directory"` \| `"inline"`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`referencesMode`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#referencesmode)

***

### removeRawFrontmatterKeys()

> `protected` **removeRawFrontmatterKeys**(`rawFrontmatter`, `keys`): `string`

Defined in: [formatters/src/base-formatter.ts:1233](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L1233)

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

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`removeRawFrontmatterKeys`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#removerawfrontmatterkeys)

***

### renderCodeFence()

> `protected` **renderCodeFence**(`content`, `lang?`): `string`

Defined in: [formatters/src/base-formatter.ts:1409](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L1409)

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

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`renderCodeFence`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#rendercodefence)

***

### renderExamplesSection()

> `protected` **renderExamplesSection**(`ast`, `renderer`, `sectionName?`): `string` \| `null`

Defined in: [formatters/src/base-formatter.ts:1065](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L1065)

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

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`renderExamplesSection`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#renderexamplessection)

***

### resolveSkillDir()

> `protected` **resolveSkillDir**(`defaultSkillBasePath`, `skillName`, `outputDir?`, `options?`): `string`

Defined in: [formatters/src/base-formatter.ts:926](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L926)

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

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`resolveSkillDir`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#resolveskilldir)

***

### resolveVersion()

> `protected` **resolveVersion**(`version?`): [`MarkdownVersion`](https://getpromptscript.dev/api-reference/formatters/src/type-aliases/MarkdownVersion/index.md)

Defined in: [formatters/src/markdown-instruction-formatter.ts:302](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L302)

#### Parameters

##### version?

`string`

#### Returns

[`MarkdownVersion`](https://getpromptscript.dev/api-reference/formatters/src/type-aliases/MarkdownVersion/index.md)

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`resolveVersion`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#resolveversion)

***

### restrictions()

> `protected` **restrictions**(`ast`, `renderer`): `string` \| `null`

Defined in: [formatters/src/markdown-instruction-formatter.ts:1070](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L1070)

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### renderer

[`ConventionRenderer`](https://getpromptscript.dev/api-reference/formatters/src/classes/ConventionRenderer/index.md)

#### Returns

`string` \| `null`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`restrictions`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#restrictions)

***

### sanitizeResourceFiles()

> `protected` **sanitizeResourceFiles**(`resources`, `targetDir`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)[]

Defined in: [formatters/src/base-formatter.ts:982](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L982)

Filter resource files to only include safe canonical paths.

#### Parameters

##### resources

`object`[] \| `undefined`

##### targetDir

`string`

#### Returns

[`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)[]

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`sanitizeResourceFiles`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#sanitizeresourcefiles)

***

### shiftContextHeadings()

> `protected` **shiftContextHeadings**(`text`): `string`

Defined in: [formatters/src/base-formatter.ts:846](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L846)

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

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`shiftContextHeadings`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#shiftcontextheadings)

***

### shiftHeadingsToMinLevel()

> `protected` **shiftHeadingsToMinLevel**(`text`, `targetLevel`): `string`

Defined in: [formatters/src/base-formatter.ts:807](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L807)

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

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`shiftHeadingsToMinLevel`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#shiftheadingstominlevel)

***

### shortcutSummary()

> `protected` **shortcutSummary**(`value`, `fallback?`): `string`

Defined in: [formatters/src/base-formatter.ts:249](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L249)

Extract a stable one-line summary from any supported shortcut value.

#### Parameters

##### value

[`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)

##### fallback?

`string` = `''`

#### Returns

`string`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`shortcutSummary`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#shortcutsummary)

***

### shouldIncludeSkill()

> `protected` **shouldIncludeSkill**(`name`, `options?`): `boolean`

Defined in: [formatters/src/base-formatter.ts:915](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L915)

Return true when the target configuration allows emitting the given skill.

#### Parameters

##### name

`string`

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

`boolean`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`shouldIncludeSkill`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#shouldincludeskill)

***

### startFormat()

> `protected` **startFormat**(`options?`): `void`

Defined in: [formatters/src/base-formatter.ts:55](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L55)

Call first in `format`, so markdown helpers know whether to keep the text
as written. The state is reset on every call.

#### Parameters

##### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatOptions/index.md)

#### Returns

`void`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`startFormat`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#startformat)

***

### stripAllIndent()

> `protected` **stripAllIndent**(`content`): `string`

Defined in: [formatters/src/base-formatter.ts:673](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L673)

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

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`stripAllIndent`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#stripallindent)

***

### techStack()

> `protected` **techStack**(`ast`, `renderer`): `string` \| `null`

Defined in: [formatters/src/markdown-instruction-formatter.ts:710](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L710)

#### Parameters

##### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

##### renderer

[`ConventionRenderer`](https://getpromptscript.dev/api-reference/formatters/src/classes/ConventionRenderer/index.md)

#### Returns

`string` \| `null`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`techStack`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#techstack)

***

### transformInjectedSkillContent()

> **transformInjectedSkillContent**(`content`): `string`

Defined in: [formatters/src/base-formatter.ts:1131](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L1131)

Default pass-through for injected skill content. Formatters whose target
tools restrict skill frontmatter (e.g. Factory AI) override this hook to
filter unsupported fields before the compiler writes the file.

#### Parameters

##### content

`string`

#### Returns

`string`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`transformInjectedSkillContent`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#transforminjectedskillcontent)

***

### transformRestrictionItem()

> `protected` **transformRestrictionItem**(`s`): `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:502](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/markdown-instruction-formatter.ts#L502)

#### Parameters

##### s

`string`

#### Returns

`string`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`transformRestrictionItem`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#transformrestrictionitem)

***

### truncate()

> `protected` **truncate**(`str`, `max`): `string`

Defined in: [formatters/src/base-formatter.ts:162](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L162)

Truncate string to max length with ellipsis.

#### Parameters

##### str

`string`

##### max

`number`

#### Returns

`string`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`truncate`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#truncate)

***

### valueToString()

> `protected` **valueToString**(`value`): `string`

Defined in: [formatters/src/base-formatter.ts:229](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L229)

Convert value to string representation.

#### Parameters

##### value

[`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)

#### Returns

`string`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`valueToString`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#valuetostring)

***

### yamlQuoted()

> `protected` **yamlQuoted**(`value`): `string`

Defined in: [formatters/src/base-formatter.ts:299](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L299)

Escape a value for use inside a double-quoted YAML scalar.

#### Parameters

##### value

`string`

#### Returns

`string`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`yamlQuoted`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#yamlquoted)

***

### yamlString()

> `protected` **yamlString**(`value`): `string`

Defined in: [formatters/src/base-formatter.ts:1202](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/base-formatter.ts#L1202)

Serialize a string as a YAML scalar, quoting only when required.

#### Parameters

##### value

`string`

#### Returns

`string`

#### Inherited from

[`MarkdownInstructionFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md).[`yamlString`](https://getpromptscript.dev/api-reference/formatters/src/classes/MarkdownInstructionFormatter/index.md#yamlstring)

***

### getSupportedVersions()

> `static` **getSupportedVersions**(): [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

Defined in: [formatters/src/formatters/trae.ts:48](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/formatters/src/formatters/trae.ts#L48)

#### Returns

[`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)