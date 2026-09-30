# FACTORY_VERSIONS

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: FACTORY\_VERSIONS

> `const` **FACTORY\_VERSIONS**: `object`

Defined in: [formatters/src/formatters/factory.ts:35](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/formatters/factory.ts#L35)

Factory AI formatter version information.

## Type Declaration

### full

> `readonly` **full**: `object`

#### full.description

> `readonly` **description**: `"Multifile + droids + additional supporting files"` = `'Multifile + droids + additional supporting files'`

#### full.name

> `readonly` **name**: `"full"` = `'full'`

#### full.outputPath

> `readonly` **outputPath**: `"AGENTS.md"` = `'AGENTS.md'`

### multifile

> `readonly` **multifile**: `object`

#### multifile.description

> `readonly` **description**: `"AGENTS.md + .factory/skills/<name>/SKILL.md"` = `'AGENTS.md + .factory/skills/<name>/SKILL.md'`

#### multifile.name

> `readonly` **name**: `"multifile"` = `'multifile'`

#### multifile.outputPath

> `readonly` **outputPath**: `"AGENTS.md"` = `'AGENTS.md'`

### simple

> `readonly` **simple**: `object`

#### simple.description

> `readonly` **description**: `"Single AGENTS.md file"` = `'Single AGENTS.md file'`

#### simple.name

> `readonly` **name**: `"simple"` = `'simple'`

#### simple.outputPath

> `readonly` **outputPath**: `"AGENTS.md"` = `'AGENTS.md'`