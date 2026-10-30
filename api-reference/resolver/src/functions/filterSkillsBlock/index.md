# filterSkillsBlock()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: filterSkillsBlock()

> **filterSkillsBlock**(`program`, `options`): [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Defined in: [resolver/src/imports.ts:147](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/resolver/src/imports.ts#L147)

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