# filterSkillsBlock()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: filterSkillsBlock()

> **filterSkillsBlock**(`program`, `options`): [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Defined in: [resolver/src/imports.ts:147](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/imports.ts#L147)

Filter the

## Parameters

### program

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

### options

[`SkillFilterOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/SkillFilterOptions/index.md)

## Returns

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

## Skills

block within a program based on includes/excludes criteria.
Operates on the ObjectContent properties of the

## Skills

block, filtering
individual skills by name. Other blocks are left untouched.

Returns a new Program with a deep-cloned

## Skills

block; does not mutate the
input (important for cached ASTs).