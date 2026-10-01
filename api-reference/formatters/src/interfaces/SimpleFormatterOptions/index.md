# SimpleFormatterOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: SimpleFormatterOptions

Defined in: [formatters/src/create-simple-formatter.ts:28](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/create-simple-formatter.ts#L28)

Options for creating a simple markdown formatter via the factory.

These options are the only things that vary across the
tier-1/2/3 formatters that have no method overrides.

## Properties

### description

> **description**: `string`

Defined in: [formatters/src/create-simple-formatter.ts:34](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/create-simple-formatter.ts#L34)

Human-readable description (e.g. 'Windsurf rules (Markdown)')

***

### dotDir

> **dotDir**: `string`

Defined in: [formatters/src/create-simple-formatter.ts:38](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/create-simple-formatter.ts#L38)

Dot directory for skills/commands/agents (e.g. '.windsurf')

***

### hasAgents?

> `optional` **hasAgents?**: `boolean`

Defined in: [formatters/src/create-simple-formatter.ts:40](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/create-simple-formatter.ts#L40)

Whether this formatter supports agents (default: false)

***

### hasCommands?

> `optional` **hasCommands?**: `boolean`

Defined in: [formatters/src/create-simple-formatter.ts:42](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/create-simple-formatter.ts#L42)

Whether this formatter supports commands (default: false)

***

### hasSkills?

> `optional` **hasSkills?**: `boolean`

Defined in: [formatters/src/create-simple-formatter.ts:44](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/create-simple-formatter.ts#L44)

Whether this formatter supports skills (default: true)

***

### mainFileHeader

> **mainFileHeader**: `string`

Defined in: [formatters/src/create-simple-formatter.ts:36](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/create-simple-formatter.ts#L36)

Header rendered at top of main file (e.g. '# Project Rules')

***

### mcpConfigFormat?

> `optional` **mcpConfigFormat?**: `"json"` \| `"toml"`

Defined in: [formatters/src/create-simple-formatter.ts:54](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/create-simple-formatter.ts#L54)

MCP config format (default: 'json')

***

### mcpConfigPath?

> `optional` **mcpConfigPath?**: `string`

Defined in: [formatters/src/create-simple-formatter.ts:52](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/create-simple-formatter.ts#L52)

MCP config file path. If set,

#### Mcp Servers

block is emitted to this path.

***

### name

> **name**: `string`

Defined in: [formatters/src/create-simple-formatter.ts:30](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/create-simple-formatter.ts#L30)

Formatter identifier (e.g. 'windsurf', 'kode')

***

### outputPath

> **outputPath**: `string`

Defined in: [formatters/src/create-simple-formatter.ts:32](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/create-simple-formatter.ts#L32)

Default output file path (e.g. '.windsurf/rules/project.md')

***

### skillFileName?

> `optional` **skillFileName?**: `string`

Defined in: [formatters/src/create-simple-formatter.ts:48](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/create-simple-formatter.ts#L48)

Skill file name (default: 'SKILL.md')

***

### skillsDir?

> `optional` **skillsDir?**: `string`

Defined in: [formatters/src/create-simple-formatter.ts:50](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/create-simple-formatter.ts#L50)

Skill directory override (default: `<dotDir>/skills`)

***

### skillsInMultifile?

> `optional` **skillsInMultifile?**: `boolean`

Defined in: [formatters/src/create-simple-formatter.ts:46](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/create-simple-formatter.ts#L46)

Whether multifile mode emits skill files (default: false, skills stay full-mode-only)

***

### unsupportedBlocks?

> `optional` **unsupportedBlocks?**: readonly `string`[]

Defined in: [formatters/src/create-simple-formatter.ts:56](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/create-simple-formatter.ts#L56)

PromptScript blocks that this target omits with compatibility warnings.