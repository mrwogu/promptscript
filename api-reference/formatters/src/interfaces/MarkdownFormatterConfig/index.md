# MarkdownFormatterConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: MarkdownFormatterConfig

Defined in: [formatters/src/markdown-instruction-formatter.ts:100](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/markdown-instruction-formatter.ts#L100)

Configuration for a markdown instruction formatter.

## Properties

### defaultConvention

> **defaultConvention**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:108](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/markdown-instruction-formatter.ts#L108)

Default output convention

***

### description

> **description**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:106](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/markdown-instruction-formatter.ts#L106)

Human-readable description

***

### dotDir

> **dotDir**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:112](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/markdown-instruction-formatter.ts#L112)

Dot directory for additional files (e.g. '.opencode')

***

### hasAgents

> **hasAgents**: `boolean`

Defined in: [formatters/src/markdown-instruction-formatter.ts:116](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/markdown-instruction-formatter.ts#L116)

Whether this formatter supports agents

***

### hasCommands

> **hasCommands**: `boolean`

Defined in: [formatters/src/markdown-instruction-formatter.ts:118](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/markdown-instruction-formatter.ts#L118)

Whether this formatter supports commands

***

### hasSkills

> **hasSkills**: `boolean`

Defined in: [formatters/src/markdown-instruction-formatter.ts:120](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/markdown-instruction-formatter.ts#L120)

Whether this formatter supports skills

***

### hookAdapterTarget?

> `optional` **hookAdapterTarget?**: `"claude"` \| `"cursor"` \| `"factory"` \| `"codex"`

Defined in: [formatters/src/markdown-instruction-formatter.ts:136](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/markdown-instruction-formatter.ts#L136)

Hook adapter target name (default: same as formatter name)

***

### hooksConfigPath?

> `optional` **hooksConfigPath?**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:134](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/markdown-instruction-formatter.ts#L134)

Hook settings file path (e.g. '.cursor/hooks.json'). If set,

#### Hooks

block is emitted to this path.

***

### mainFileHeader

> **mainFileHeader**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:110](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/markdown-instruction-formatter.ts#L110)

Main file header (e.g. '# OPENCODE.md')

***

### mcpConfigFormat?

> `optional` **mcpConfigFormat?**: `"json"` \| `"toml"`

Defined in: [formatters/src/markdown-instruction-formatter.ts:132](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/markdown-instruction-formatter.ts#L132)

MCP config format (default: 'json')

***

### mcpConfigPath?

> `optional` **mcpConfigPath?**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:130](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/markdown-instruction-formatter.ts#L130)

MCP config file path (e.g. '.windsurf/mcp_config.json'). If set,

#### Mcp Servers

block is emitted to this path.

***

### name

> **name**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:102](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/markdown-instruction-formatter.ts#L102)

Formatter name (e.g. 'opencode', 'gemini')

***

### outputPath

> **outputPath**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:104](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/markdown-instruction-formatter.ts#L104)

Default output file path (e.g. 'OPENCODE.md')

***

### restrictionsTransform?

> `optional` **restrictionsTransform?**: (`s`) => `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:128](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/markdown-instruction-formatter.ts#L128)

Transform function for restriction items

#### Parameters

##### s

`string`

#### Returns

`string`

***

### sectionNames?

> `optional` **sectionNames?**: `Partial`\<`Record`\<[`SectionNameKey`](https://getpromptscript.dev/api-reference/formatters/src/type-aliases/SectionNameKey/index.md), `string`\>\>

Defined in: [formatters/src/markdown-instruction-formatter.ts:126](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/markdown-instruction-formatter.ts#L126)

Custom section header names

***

### skillFileName

> **skillFileName**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:114](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/markdown-instruction-formatter.ts#L114)

Skill file name (e.g. 'SKILL.md' or 'skill.md')

***

### skillsDir?

> `optional` **skillsDir?**: `string`

Defined in: [formatters/src/markdown-instruction-formatter.ts:124](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/markdown-instruction-formatter.ts#L124)

Skill directory override (default: `<dotDir>/skills`)

***

### skillsInMultifile?

> `optional` **skillsInMultifile?**: `boolean`

Defined in: [formatters/src/markdown-instruction-formatter.ts:122](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/markdown-instruction-formatter.ts#L122)

Whether skills are included in multifile mode (default: false, only in full)

***

### unsupportedBlocks?

> `optional` **unsupportedBlocks?**: readonly `string`[]

Defined in: [formatters/src/markdown-instruction-formatter.ts:138](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/markdown-instruction-formatter.ts#L138)

PromptScript blocks omitted by this target with compatibility warnings.