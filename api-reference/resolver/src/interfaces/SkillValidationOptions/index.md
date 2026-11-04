# SkillValidationOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: SkillValidationOptions

Defined in: [resolver/src/skill-validation.ts:39](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/resolver/src/skill-validation.ts#L39)

Options for `validateSkillFrontmatter`.

## Properties

### existingNames?

> `optional` **existingNames?**: `ReadonlySet`\<`string`\>

Defined in: [resolver/src/skill-validation.ts:50](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/resolver/src/skill-validation.ts#L50)

Names already registered in the current project. Used to detect
collisions (two skills resolving to the same output folder).

***

### filePath?

> `optional` **filePath?**: `string`

Defined in: [resolver/src/skill-validation.ts:45](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/resolver/src/skill-validation.ts#L45)

Absolute path to the SKILL.md file being validated. When provided,
enables checks that depend on the surrounding directory (name ↔ folder
match, references existence, body size).