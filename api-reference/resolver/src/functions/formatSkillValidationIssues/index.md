# formatSkillValidationIssues()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: formatSkillValidationIssues()

> **formatSkillValidationIssues**(`issues`): `string`

Defined in: [resolver/src/skill-validation.ts:322](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/resolver/src/skill-validation.ts#L322)

Format validation issues as a multi-line string suitable for CLI output.
Each line is prefixed with the severity and code.

## Parameters

### issues

readonly [`SkillValidationIssue`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/SkillValidationIssue/index.md)[]

## Returns

`string`