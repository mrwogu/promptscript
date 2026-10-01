# extractSkillFrontmatter()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: extractSkillFrontmatter()

> **extractSkillFrontmatter**(`content`, `sourceFile?`): [`SkillFrontmatterBlock`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/SkillFrontmatterBlock/index.md) \| `null`

Defined in: [resolver/src/skills.ts:207](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/skills.ts#L207)

Extract a SKILL.md frontmatter block using the same delimiter rules as the
parser and validator.

## Parameters

### content

`string`

### sourceFile?

`string` = `'<skill>'`

## Returns

[`SkillFrontmatterBlock`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/SkillFrontmatterBlock/index.md) \| `null`