# formatSkillValidationIssues()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: formatSkillValidationIssues()

> **formatSkillValidationIssues**(`issues`): `string`

Defined in: [resolver/src/skill-validation.ts:322](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/resolver/src/skill-validation.ts#L322)

Format validation issues as a multi-line string suitable for CLI output.
Each line is prefixed with the severity and code.

## Parameters

### issues

readonly [`SkillValidationIssue`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/SkillValidationIssue/index.md)[]

## Returns

`string`