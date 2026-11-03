# MarkdownFormatterConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: MarkdownFormatterConfig

Defined in: [formatters/src/markdown-instruction-formatter.ts:101](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/markdown-instruction-formatter.ts#L101)

Configuration for a markdown instruction formatter.

## Properties

### defaultConvention

> **defaultConvention**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:109](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/markdown-instruction-formatter.ts#L109)

Default output convention

***

### description

> **description**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:107](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/markdown-instruction-formatter.ts#L107)

Human-readable description

***

### dotDir

> **dotDir**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:113](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/markdown-instruction-formatter.ts#L113)

Dot directory for additional files (e.g. '.opencode')

***

### hasAgents

> **hasAgents**: `boolean`

Defined in: [formatters/src/markdown-instruction-formatter.ts:117](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/markdown-instruction-formatter.ts#L117)

Whether this formatter supports agents

***

### hasCommands

> **hasCommands**: `boolean`

Defined in: [formatters/src/markdown-instruction-formatter.ts:119](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/markdown-instruction-formatter.ts#L119)

Whether this formatter supports commands

***

### hasSkills

> **hasSkills**: `boolean`

Defined in: [formatters/src/markdown-instruction-formatter.ts:121](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/markdown-instruction-formatter.ts#L121)

Whether this formatter supports skills

***

### hookAdapterTarget?

> `optional` **hookAdapterTarget?**: `"claude"` \| `"cursor"` \| `"factory"` \| `"codex"`

Defined in: [formatters/src/markdown-instruction-formatter.ts:137](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/markdown-instruction-formatter.ts#L137)

Hook adapter target name (default: same as formatter name)

***

### hooksConfigPath?

> `optional` **hooksConfigPath?**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:135](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/markdown-instruction-formatter.ts#L135)

Hook settings file path (e.g. '.cursor/hooks.json'). If set,

#### Hooks

block is emitted to this path.

***

### mainFileHeader

> **mainFileHeader**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:111](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/markdown-instruction-formatter.ts#L111)

Main file header (e.g. '# OPENCODE.md')

***

### mcpConfigFormat?

> `optional` **mcpConfigFormat?**: `"json"` \| `"toml"`

Defined in: [formatters/src/markdown-instruction-formatter.ts:133](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/markdown-instruction-formatter.ts#L133)

MCP config format (default: 'json')

***

### mcpConfigPath?

> `optional` **mcpConfigPath?**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:131](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/markdown-instruction-formatter.ts#L131)

MCP config file path (e.g. '.windsurf/mcp_config.json'). If set,

#### Mcp Servers

block is emitted to this path.

***

### name

> **name**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:103](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/markdown-instruction-formatter.ts#L103)

Formatter name (e.g. 'opencode', 'gemini')

***

### outputPath

> **outputPath**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:105](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/markdown-instruction-formatter.ts#L105)

Default output file path (e.g. 'OPENCODE.md')

***

### restrictionsTransform?

> `optional` **restrictionsTransform?**: (`s`) => `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:129](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/markdown-instruction-formatter.ts#L129)

Transform function for restriction items

#### Parameters

##### s

`string`

#### Returns

`string`

***

### sectionNames?

> `optional` **sectionNames?**: `Partial`\<`Record`\<[`SectionNameKey`](https://getpromptscript.dev/api-reference/formatters/src/type-aliases/SectionNameKey/index.md), `string`\>\>

Defined in: [formatters/src/markdown-instruction-formatter.ts:127](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/markdown-instruction-formatter.ts#L127)

Custom section header names

***

### skillFileName

> **skillFileName**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:115](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/markdown-instruction-formatter.ts#L115)

Skill file name (e.g. 'SKILL.md' or 'skill.md')

***

### skillsDir?

> `optional` **skillsDir?**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:125](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/markdown-instruction-formatter.ts#L125)

Skill directory override (default: `<dotDir>/skills`)

***

### skillsInMultifile?

> `optional` **skillsInMultifile?**: `boolean`

Defined in: [formatters/src/markdown-instruction-formatter.ts:123](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/markdown-instruction-formatter.ts#L123)

Whether skills are included in multifile mode (default: false, only in full)

***

### unsupportedBlocks?

> `optional` **unsupportedBlocks?**: readonly `string`[]

Defined in: [formatters/src/markdown-instruction-formatter.ts:139](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/formatters/src/markdown-instruction-formatter.ts#L139)

PromptScript blocks omitted by this target with compatibility warnings.