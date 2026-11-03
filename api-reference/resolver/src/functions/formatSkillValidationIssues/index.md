# formatSkillValidationIssues()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: formatSkillValidationIssues()

> **formatSkillValidationIssues**(`issues`): `string`

Defined in: [resolver/src/skill-validation.ts:322](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/resolver/src/skill-validation.ts#L322)

Format validation issues as a multi-line string suitable for CLI output.
Each line is prefixed with the severity and code.

## Parameters

### issues

readonly [`SkillValidationIssue`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/SkillValidationIssue/index.md)[]

## Returns

`string`