# formatSkillValidationIssues()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: formatSkillValidationIssues()

> **formatSkillValidationIssues**(`issues`): `string`

Defined in: [resolver/src/skill-validation.ts:322](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/resolver/src/skill-validation.ts#L322)

Format validation issues as a multi-line string suitable for CLI output.
Each line is prefixed with the severity and code.

## Parameters

### issues

readonly [`SkillValidationIssue`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/SkillValidationIssue/index.md)[]

## Returns

`string`