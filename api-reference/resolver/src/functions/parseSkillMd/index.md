# parseSkillMd()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parseSkillMd()

> **parseSkillMd**(`content`, `sourceFile?`): [`ParsedSkillMd`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/ParsedSkillMd/index.md)

Defined in: [resolver/src/skills.ts:137](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/skills.ts#L137)

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