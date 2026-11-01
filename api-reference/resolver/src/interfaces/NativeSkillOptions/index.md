# NativeSkillOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: NativeSkillOptions

Defined in: [resolver/src/skills.ts:1804](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/resolver/src/skills.ts#L1804)

Options for native skill resolution.

## Properties

### logger?

> `optional` **logger?**: [`Logger`](https://getpromptscript.dev/api-reference/core/src/interfaces/Logger/index.md)

Defined in: [resolver/src/skills.ts:1818](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/resolver/src/skills.ts#L1818)

Logger for reporting skipped files and resolution decisions.

***

### projectRoot?

> `optional` **projectRoot?**: `string`

Defined in: [resolver/src/skills.ts:1816](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/resolver/src/skills.ts#L1816)

Project root the universal directory sits in. Without it the root is
guessed as the parent of `localPath`, which only holds while `localPath`
is the `.promptscript` directory.

***

### universalDir?

> `optional` **universalDir?**: `string`

Defined in: [resolver/src/skills.ts:1810](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/resolver/src/skills.ts#L1810)

Path to the universal directory for auto-discovering skills and commands.
When set, skills are discovered from `<universalDir>/skills/` and commands from `<universalDir>/commands/`.
Defaults to undefined (disabled). Typically set to `.agents`.