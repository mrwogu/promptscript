# duplicateSkills

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: duplicateSkills

> `const` **duplicateSkills**: [`ValidationRule`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationRule/index.md)

Defined in: [validator/src/rules/duplicate-skills.ts:10](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/validator/src/rules/duplicate-skills.ts#L10)

PS020: Duplicate skill names

Detects duplicate skill names that arise from:
- Multiple

## Use

directives importing skills with the same alias
- Duplicate keys in the

## Skills

block across different import sources