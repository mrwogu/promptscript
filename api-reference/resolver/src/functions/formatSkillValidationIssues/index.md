# formatSkillValidationIssues()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: formatSkillValidationIssues()

> **formatSkillValidationIssues**(`issues`): `string`

Defined in: [resolver/src/skill-validation.ts:322](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/resolver/src/skill-validation.ts#L322)

Format validation issues as a multi-line string suitable for CLI output.
Each line is prefixed with the severity and code.

## Parameters

### issues

readonly [`SkillValidationIssue`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/SkillValidationIssue/index.md)[]

## Returns

`string`