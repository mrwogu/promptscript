# validateSkillFrontmatter()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: validateSkillFrontmatter()

> **validateSkillFrontmatter**(`rawContent`, `options?`): [`SkillValidationResult`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/SkillValidationResult/index.md)

Defined in: [resolver/src/skill-validation.ts:63](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/skill-validation.ts#L63)

Validate a SKILL.md frontmatter and body against the Agent Skills
specification (see https://agentskills.io/specification) and PromptScript's
additional quality recommendations.

Errors mirror what `skills-ref validate` rejects (name format, description
presence, directory match, …). Warnings cover quality smells the spec
recommends but does not strictly enforce (short description, oversized
body, missing license, unpinned version, …).

## Parameters

### rawContent

`string`

### options?

[`SkillValidationOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/SkillValidationOptions/index.md) = `{}`

## Returns

[`SkillValidationResult`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/SkillValidationResult/index.md)