# CompileOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CompileOptions

Defined in: [cli/src/types.ts:58](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/types.ts#L58)

Options for the compile command.

## Properties

### all?

> `optional` **all?**: `boolean`

Defined in: [cli/src/types.ts:68](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/types.ts#L68)

Compile all configured targets

***

### allBuilds?

> `optional` **allBuilds?**: `boolean`

Defined in: [cli/src/types.ts:62](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/types.ts#L62)

Compile all named build profiles in deterministic key order

***

### build?

> `optional` **build?**: `string`

Defined in: [cli/src/types.ts:60](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/types.ts#L60)

Named build profile from config.builds

***

### config?

> `optional` **config?**: `string`

Defined in: [cli/src/types.ts:86](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/types.ts#L86)

Path to custom config file

***

### cwd?

> `optional` **cwd?**: `string`

Defined in: [cli/src/types.ts:94](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/types.ts#L94)

Working directory (project root)

***

### dryRun?

> `optional` **dryRun?**: `boolean`

Defined in: [cli/src/types.ts:80](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/types.ts#L80)

Preview changes without writing files

***

### force?

> `optional` **force?**: `boolean`

Defined in: [cli/src/types.ts:88](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/types.ts#L88)

Force overwrite existing files without prompts

***

### format?

> `optional` **format?**: `string`

Defined in: [cli/src/types.ts:66](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/types.ts#L66)

Output format (github, claude, cursor) - alias for target

***

### ignoreHashes?

> `optional` **ignoreHashes?**: `boolean`

Defined in: [cli/src/types.ts:92](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/types.ts#L92)

Skip reference integrity hash verification

***

### migrateFactoryHooks?

> `optional` **migrateFactoryHooks?**: `boolean`

Defined in: [cli/src/types.ts:82](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/types.ts#L82)

Migrate unambiguous legacy Factory settings hooks during compilation

***

### output?

> `optional` **output?**: `string`

Defined in: [cli/src/types.ts:72](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/types.ts#L72)

Output directory

***

### registry?

> `optional` **registry?**: `string`

Defined in: [cli/src/types.ts:84](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/types.ts#L84)

Registry path or URL (overrides config)

***

### resources?

> `optional` **resources?**: `string`[]

Defined in: [cli/src/types.ts:78](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/types.ts#L78)

Compile only selected resource kinds (agents, skills, commands, mcp,
hooks, plugins, main). Omits unselected resources and, without `main`,
all root instruction files.

***

### strict?

> `optional` **strict?**: `boolean`

Defined in: [cli/src/types.ts:90](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/types.ts#L90)

Treat output path conflicts as errors

***

### target?

> `optional` **target?**: `string`

Defined in: [cli/src/types.ts:64](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/types.ts#L64)

Specific target to compile (github, claude, cursor)

***

### watch?

> `optional` **watch?**: `boolean`

Defined in: [cli/src/types.ts:70](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/cli/src/types.ts#L70)

Watch mode for continuous compilation