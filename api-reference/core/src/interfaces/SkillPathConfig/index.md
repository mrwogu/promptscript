# SkillPathConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: SkillPathConfig

Defined in: [core/src/target-catalog.ts:41](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/target-catalog.ts#L41)

Skill path configuration for a target.
- `basePath`: Directory where skill files are written (e.g. '.claude/skills')
- `fileName`: Skill file name (e.g. 'SKILL.md' or 'skill.md')
- Both are null when the target does not support skills.

## Properties

### basePath

> **basePath**: `string` \| `null`

Defined in: [core/src/target-catalog.ts:42](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/target-catalog.ts#L42)

***

### fileName

> **fileName**: `string` \| `null`

Defined in: [core/src/target-catalog.ts:43](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/target-catalog.ts#L43)