# GEMINI_VERSIONS

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: GEMINI\_VERSIONS

> `const` **GEMINI\_VERSIONS**: `object`

Defined in: [formatters/src/formatters/gemini.ts:22](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/formatters/gemini.ts#L22)

Gemini formatter version information.

## Type Declaration

### full

> `readonly` **full**: `object`

#### full.description

> `readonly` **description**: `"Multifile (Gemini has no agent concept, equivalent to multifile)"` = `'Multifile (Gemini has no agent concept, equivalent to multifile)'`

#### full.name

> `readonly` **name**: `"full"` = `'full'`

#### full.outputPath

> `readonly` **outputPath**: `"GEMINI.md"` = `'GEMINI.md'`

### multifile

> `readonly` **multifile**: `object`

#### multifile.description

> `readonly` **description**: `"GEMINI.md + .gemini/commands/<name>.toml + .gemini/skills/<name>/skill.md"` = `'GEMINI.md + .gemini/commands/<name>.toml + .gemini/skills/<name>/skill.md'`

#### multifile.name

> `readonly` **name**: `"multifile"` = `'multifile'`

#### multifile.outputPath

> `readonly` **outputPath**: `"GEMINI.md"` = `'GEMINI.md'`

### simple

> `readonly` **simple**: `object`

#### simple.description

> `readonly` **description**: `"Single GEMINI.md file"` = `'Single GEMINI.md file'`

#### simple.name

> `readonly` **name**: `"simple"` = `'simple'`

#### simple.outputPath

> `readonly` **outputPath**: `"GEMINI.md"` = `'GEMINI.md'`