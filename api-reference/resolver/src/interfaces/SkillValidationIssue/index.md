# SkillValidationIssue

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: SkillValidationIssue

Defined in: [resolver/src/skill-validation.ts:17](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/skill-validation.ts#L17)

A single validation finding for a SKILL.md file.

## Properties

### code

> **code**: `string`

Defined in: [resolver/src/skill-validation.ts:20](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/skill-validation.ts#L20)

Stable identifier (e.g. `SK001`) for documentation and suppression

***

### field?

> `optional` **field?**: `string`

Defined in: [resolver/src/skill-validation.ts:23](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/skill-validation.ts#L23)

Frontmatter field the issue relates to (when applicable)

***

### location?

> `optional` **location?**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [resolver/src/skill-validation.ts:25](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/skill-validation.ts#L25)

Source location for parser and frontmatter diagnostics, when available

***

### message

> **message**: `string`

Defined in: [resolver/src/skill-validation.ts:21](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/skill-validation.ts#L21)

***

### severity

> **severity**: [`SkillValidationSeverity`](https://getpromptscript.dev/api-reference/resolver/src/type-aliases/SkillValidationSeverity/index.md)

Defined in: [resolver/src/skill-validation.ts:18](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/skill-validation.ts#L18)