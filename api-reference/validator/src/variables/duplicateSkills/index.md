# duplicateSkills

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: duplicateSkills

> `const` **duplicateSkills**: [`ValidationRule`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationRule/index.md)

Defined in: [validator/src/rules/duplicate-skills.ts:10](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/validator/src/rules/duplicate-skills.ts#L10)

PS020: Duplicate skill names

Detects duplicate skill names that arise from:
- Multiple

## Use

directives importing skills with the same alias
- Duplicate keys in the

## Skills

block across different import sources