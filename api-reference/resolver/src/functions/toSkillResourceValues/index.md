# toSkillResourceValues()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: toSkillResourceValues()

> **toSkillResourceValues**(`resources`): [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)[]

Defined in: [resolver/src/skill-resources.ts:117](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/skill-resources.ts#L117)

Convert resources into the AST value shape stored on a skill definition.

## Parameters

### resources

readonly `SkillResource`[]

Resources collected for a skill

## Returns

[`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)[]

Plain AST values ready to assign to the skill's `resources` property