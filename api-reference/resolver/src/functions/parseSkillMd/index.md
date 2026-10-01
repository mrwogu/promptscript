# parseSkillMd()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parseSkillMd()

> **parseSkillMd**(`content`, `sourceFile?`): [`ParsedSkillMd`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ParsedSkillMd/index.md)

Defined in: [resolver/src/skills.ts:137](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/skills.ts#L137)

Parse a SKILL.md file extracting frontmatter and content.

## Parameters

### content

`string`

Raw SKILL.md file content

### sourceFile?

`string` = `'<skill>'`

Optional source path used in resolver diagnostics

## Returns

[`ParsedSkillMd`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ParsedSkillMd/index.md)

Parsed skill metadata and content