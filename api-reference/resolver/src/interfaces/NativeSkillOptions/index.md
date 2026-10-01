# NativeSkillOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: NativeSkillOptions

Defined in: [resolver/src/skills.ts:1786](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/skills.ts#L1786)

Options for native skill resolution.

## Properties

### logger?

> `optional` **logger?**: [`Logger`](https://getpromptscript.dev/api-reference/core/src/interfaces/Logger/index.md)

Defined in: [resolver/src/skills.ts:1800](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/skills.ts#L1800)

Logger for reporting skipped files and resolution decisions.

***

### projectRoot?

> `optional` **projectRoot?**: `string`

Defined in: [resolver/src/skills.ts:1798](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/skills.ts#L1798)

Project root the universal directory sits in. Without it the root is
guessed as the parent of `localPath`, which only holds while `localPath`
is the `.promptscript` directory.

***

### universalDir?

> `optional` **universalDir?**: `string`

Defined in: [resolver/src/skills.ts:1792](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/skills.ts#L1792)

Path to the universal directory for auto-discovering skills and commands.
When set, skills are discovered from `<universalDir>/skills/` and commands from `<universalDir>/commands/`.
Defaults to undefined (disabled). Typically set to `.agents`.