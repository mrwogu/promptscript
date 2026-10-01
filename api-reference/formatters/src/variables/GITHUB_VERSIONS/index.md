# GITHUB_VERSIONS

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: GITHUB\_VERSIONS

> `const` **GITHUB\_VERSIONS**: `object`

Defined in: [formatters/src/formatters/github.ts:27](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/formatters/github.ts#L27)

GitHub formatter version information.

## Type Declaration

### full

> `readonly` **full**: `object`

#### full.description

> `readonly` **description**: `"Multifile + skills (.github/skills/) + agents (.github/agents/) + AGENTS.md"` = `'Multifile + skills (.github/skills/) + agents (.github/agents/) + AGENTS.md'`

#### full.name

> `readonly` **name**: `"full"` = `'full'`

#### full.outputPath

> `readonly` **outputPath**: `".github/copilot-instructions.md"` = `'.github/copilot-instructions.md'`

### multifile

> `readonly` **multifile**: `object`

#### multifile.description

> `readonly` **description**: `"Main + path-specific instructions (.github/instructions/) + prompts"` = `'Main + path-specific instructions (.github/instructions/) + prompts'`

#### multifile.name

> `readonly` **name**: `"multifile"` = `'multifile'`

#### multifile.outputPath

> `readonly` **outputPath**: `".github/copilot-instructions.md"` = `'.github/copilot-instructions.md'`

### simple

> `readonly` **simple**: `object`

#### simple.description

> `readonly` **description**: `"Single file output (.github/copilot-instructions.md)"` = `'Single file output (.github/copilot-instructions.md)'`

#### simple.name

> `readonly` **name**: `"simple"` = `'simple'`

#### simple.outputPath

> `readonly` **outputPath**: `".github/copilot-instructions.md"` = `'.github/copilot-instructions.md'`