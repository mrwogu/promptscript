# NativeSkillOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: NativeSkillOptions

Defined in: [resolver/src/skills.ts:1788](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/resolver/src/skills.ts#L1788)

Options for native skill resolution.

## Properties

### logger?

> `optional` **logger?**: [`Logger`](https://getpromptscript.dev/api-reference/core/src/interfaces/Logger/index.md)

Defined in: [resolver/src/skills.ts:1802](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/resolver/src/skills.ts#L1802)

Logger for reporting skipped files and resolution decisions.

***

### projectRoot?

> `optional` **projectRoot?**: `string`

Defined in: [resolver/src/skills.ts:1800](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/resolver/src/skills.ts#L1800)

Project root the universal directory sits in. Without it the root is
guessed as the parent of `localPath`, which only holds while `localPath`
is the `.promptscript` directory.

***

### universalDir?

> `optional` **universalDir?**: `string`

Defined in: [resolver/src/skills.ts:1794](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/resolver/src/skills.ts#L1794)

Path to the universal directory for auto-discovering skills and commands.
When set, skills are discovered from `<universalDir>/skills/` and commands from `<universalDir>/commands/`.
Defaults to undefined (disabled). Typically set to `.agents`.