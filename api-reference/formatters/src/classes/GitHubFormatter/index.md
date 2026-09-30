# GitHubFormatter

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Class: GitHubFormatter

Defined in: [formatters/src/formatters/github.ts:191](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/formatters/github.ts#L191)

Formatter for GitHub Copilot instructions.

Supports three versions:
- **simple**: Single `.github/copilot-instructions.md` file
- **multifile**: Main + `.github/instructions/*.instructions.md` + `.github/prompts/*.prompt.md`
- **full** (default): Multifile + `.github/skills/<name>/SKILL.md` + `AGENTS.md`

## Example

```yaml
targets:
  - github  # uses full mode (default)
  - github:
      version: multifile
  - github:
      version: full
```

## See

https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot

## Extends

- [`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md)

## Constructors

### Constructor

> **new GitHubFormatter**(): `GitHubFormatter`

#### Returns

`GitHubFormatter`

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`constructor`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#constructor)

## Properties

### defaultConvention

> `readonly` **defaultConvention**: `"markdown"` = `'markdown'`

Defined in: [formatters/src/formatters/github.ts:195](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/formatters/github.ts#L195)

Default convention for this formatter

#### Overrides

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`defaultConvention`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#defaultconvention)

***

### description

> `readonly` **description**: `"GitHub Copilot instructions (Markdown)"` = `'GitHub Copilot instructions (Markdown)'`

Defined in: [formatters/src/formatters/github.ts:194](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/formatters/github.ts#L194)

Human-readable description

#### Overrides

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`description`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#description)

***

### name

> `readonly` **name**: `"github"` = `'github'`

Defined in: [formatters/src/formatters/github.ts:192](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/formatters/github.ts#L192)

Unique formatter identifier

#### Overrides

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`name`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#name)

***

### outputPath

> `readonly` **outputPath**: `".github/copilot-instructions.md"` = `'.github/copilot-instructions.md'`

Defined in: [formatters/src/formatters/github.ts:193](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/formatters/github.ts#L193)

Default output file path

#### Overrides

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`outputPath`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#outputpath)

***

### standardsExtractor

> `protected` `readonly` **standardsExtractor**: `StandardsExtractor`

Defined in: [formatters/src/base-formatter.ts:48](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L48)

Shared standards extractor for consistent extraction across all formatters.

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`standardsExtractor`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#standardsextractor)

***

### CONTEXT\_RENDERED\_KEYS

> `protected` `readonly` `static` **CONTEXT\_RENDERED\_KEYS**: `ReadonlySet`\<`string`\>

Defined in: [formatters/src/base-formatter.ts:273](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L273)

`@context` keys that already have a dedicated rendering path. Anything
outside this set is generic and must be surfaced by the context section.

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`CONTEXT_RENDERED_KEYS`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#context_rendered_keys)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`appendGenericStandardItems`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#appendgenericstandarditems)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`contextArchitectureProperty`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#contextarchitectureproperty)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`contextPropertyItems`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#contextpropertyitems)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`contextTextConsumedByProject`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#contexttextconsumedbyproject)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`createRenderer`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#createrenderer)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`dedent`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#dedent)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`documentationItem`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#documentationitem)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`extractContextTechStackItems`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#extractcontexttechstackitems)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`extractExamples`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#extractexamples)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`extractSectionWithCodeBlock`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#extractsectionwithcodeblock)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`extractSkillExamples`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#extractskillexamples)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`extractSkills`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#extractskills)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`extractText`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#extracttext)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`findBlock`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#findblock)

***

### format()

> **format**(`ast`, `options?`): [`FormatterOutput`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/FormatterOutput/index.md)

Defined in: [formatters/src/formatters/github.ts:216](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/formatters/github.ts#L216)

Transform AST to target format

#### Parameters

##### ast

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

Defined in: [formatters/src/base-formatter.ts:140](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L140)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`formatCanonical`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#formatcanonical)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`formatStandardsList`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#formatstandardslist)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`generateSkillFile`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#generateskillfile)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`getArrayElements`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#getarrayelements)

***

### getBlockArrayElements()

> `protected` **getBlockArrayElements**(`block`): [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)[]

Defined in: [formatters/src/base-formatter.ts:187](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/base-formatter.ts#L187)

#### Parameters

##### block

[`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md)

#### Returns

[`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)[]

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`getBlockArrayElements`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#getblockarrayelements)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`getMetaField`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#getmetafield)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`getNativeAgentName`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#getnativeagentname)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`getNativeAgentNameMap`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#getnativeagentnamemap)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`getOutputPath`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#getoutputpath)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`getPrettierOptions`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#getprettieroptions)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`getProp`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#getprop)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`getProps`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#getprops)

***

### getSkillBasePath()

> **getSkillBasePath**(): `string` \| `null`

Defined in: [formatters/src/formatters/github.ts:204](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/formatters/github.ts#L204)

Base path for skills, or null if formatter has no skill support.

#### Returns

`string` \| `null`

#### Overrides

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`getSkillBasePath`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#getskillbasepath)

***

### getSkillFileName()

> **getSkillFileName**(): `string` \| `null`

Defined in: [formatters/src/formatters/github.ts:208](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/formatters/github.ts#L208)

Skill file name, or null if formatter has no skill support.

#### Returns

`string` \| `null`

#### Overrides

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`getSkillFileName`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#getskillfilename)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`humanizeLabel`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#humanizelabel)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`isSafeAgentName`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#issafeagentname)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`isSafeName`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#issafename)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`isSafeSkillName`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#issafeskillname)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`mergeRequiredSkillFrontmatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#mergerequiredskillfrontmatter)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`normalizeMarkdownForPrettier`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#normalizemarkdownforprettier)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`normalizeOutputDir`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#normalizeoutputdir)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`normalizeResourcePath`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#normalizeresourcepath)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`referenceProvenance`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#referenceprovenance)

***

### referencesMode()

> **referencesMode**(): `"none"` \| `"directory"` \| `"inline"`

Defined in: [formatters/src/formatters/github.ts:212](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/formatters/github.ts#L212)

How this formatter handles skill references.
- 'directory': emit as separate files in references/ subdirectory
- 'inline': append as sections in the main output file
- 'none': references not supported

#### Returns

`"none"` \| `"directory"` \| `"inline"`

#### Overrides

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`referencesMode`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#referencesmode)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`renderCodeFence`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#rendercodefence)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`renderExamplesSection`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#renderexamplessection)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`resolveSkillDir`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#resolveskilldir)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`sanitizeResourceFiles`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#sanitizeresourcefiles)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`shortcutSummary`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#shortcutsummary)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`shouldIncludeSkill`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#shouldincludeskill)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`stripAllIndent`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#stripallindent)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`transformInjectedSkillContent`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#transforminjectedskillcontent)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`truncate`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#truncate)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`valueToString`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#valuetostring)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`yamlQuoted`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#yamlquoted)

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

#### Inherited from

[`BaseFormatter`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md).[`yamlString`](https://getpromptscript.dev/api-reference/formatters/src/classes/BaseFormatter/index.md#yamlstring)

***

### getSupportedVersions()

> `static` **getSupportedVersions**(): `object`

Defined in: [formatters/src/formatters/github.ts:200](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/formatters/github.ts#L200)

Get supported versions for this formatter.

#### Returns

`object`

##### full

> `readonly` **full**: `object`

###### full.description

> `readonly` **description**: `"Multifile + skills (.github/skills/) + agents (.github/agents/) + AGENTS.md"` = `'Multifile + skills (.github/skills/) + agents (.github/agents/) + AGENTS.md'`

###### full.name

> `readonly` **name**: `"full"` = `'full'`

###### full.outputPath

> `readonly` **outputPath**: `".github/copilot-instructions.md"` = `'.github/copilot-instructions.md'`

##### multifile

> `readonly` **multifile**: `object`

###### multifile.description

> `readonly` **description**: `"Main + path-specific instructions (.github/instructions/) + prompts"` = `'Main + path-specific instructions (.github/instructions/) + prompts'`

###### multifile.name

> `readonly` **name**: `"multifile"` = `'multifile'`

###### multifile.outputPath

> `readonly` **outputPath**: `".github/copilot-instructions.md"` = `'.github/copilot-instructions.md'`

##### simple

> `readonly` **simple**: `object`

###### simple.description

> `readonly` **description**: `"Single file output (.github/copilot-instructions.md)"` = `'Single file output (.github/copilot-instructions.md)'`

###### simple.name

> `readonly` **name**: `"simple"` = `'simple'`

###### simple.outputPath

> `readonly` **outputPath**: `".github/copilot-instructions.md"` = `'.github/copilot-instructions.md'`