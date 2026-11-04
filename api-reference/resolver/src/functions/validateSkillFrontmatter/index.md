# validateSkillFrontmatter()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: validateSkillFrontmatter()

> **validateSkillFrontmatter**(`rawContent`, `options?`): [`SkillValidationResult`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/SkillValidationResult/index.md)

Defined in: [resolver/src/skill-validation.ts:63](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/resolver/src/skill-validation.ts#L63)

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