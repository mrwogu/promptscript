# interpolateSkillContent()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: interpolateSkillContent()

> **interpolateSkillContent**(`content`, `params`, `args`): `string`

Defined in: [resolver/src/skills.ts:1076](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/resolver/src/skills.ts#L1076)

Interpolate skill content with parameter values.

Binds provided arguments and defaults to {{variable}} placeholders
in the skill content string.

## Parameters

### content

`string`

Skill content with {{variable}} placeholders

### params

[`ParamDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/ParamDefinition/index.md)[] \| `undefined`

Parameter definitions from SKILL.md frontmatter

### args

`Record`\<`string`, [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)\>

Argument values provided at the call site

## Returns

`string`

Interpolated content string