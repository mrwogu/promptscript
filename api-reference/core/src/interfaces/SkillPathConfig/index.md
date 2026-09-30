# SkillPathConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: SkillPathConfig

Defined in: [core/src/target-catalog.ts:39](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/target-catalog.ts#L39)

Skill path configuration for a target.
- `basePath`: Directory where skill files are written (e.g. '.claude/skills')
- `fileName`: Skill file name (e.g. 'SKILL.md' or 'skill.md')
- Both are null when the target does not support skills.

## Properties

### basePath

> **basePath**: `string` \| `null`

Defined in: [core/src/target-catalog.ts:40](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/target-catalog.ts#L40)

***

### fileName

> **fileName**: `string` \| `null`

Defined in: [core/src/target-catalog.ts:41](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/target-catalog.ts#L41)