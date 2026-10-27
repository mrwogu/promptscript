# extractSkillFrontmatter()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: extractSkillFrontmatter()

> **extractSkillFrontmatter**(`content`, `sourceFile?`): [`SkillFrontmatterBlock`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/SkillFrontmatterBlock/index.md) \| `null`

Defined in: [resolver/src/skills.ts:207](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/resolver/src/skills.ts#L207)

Extract a SKILL.md frontmatter block using the same delimiter rules as the
parser and validator.

## Parameters

### content

`string`

### sourceFile?

`string` = `'<skill>'`

## Returns

[`SkillFrontmatterBlock`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/SkillFrontmatterBlock/index.md) \| `null`