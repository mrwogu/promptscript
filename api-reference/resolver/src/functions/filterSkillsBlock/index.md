# filterSkillsBlock()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: filterSkillsBlock()

> **filterSkillsBlock**(`program`, `options`): [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Defined in: [resolver/src/imports.ts:147](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/imports.ts#L147)

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