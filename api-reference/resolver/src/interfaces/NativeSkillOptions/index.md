# NativeSkillOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: NativeSkillOptions

Defined in: [resolver/src/skills.ts:1805](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/resolver/src/skills.ts#L1805)

Options for native skill resolution.

## Properties

### discoverUndeclared?

> `optional` **discoverUndeclared?**: `boolean`

Defined in: [resolver/src/skills.ts:1826](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/resolver/src/skills.ts#L1826)

Add skills found in the skills directories that the file does not
declare. Defaults to true. The resolver turns it off for imported files,
so each found skill is added once, by the entry file, and two fragments
with `@skills` do not both carry it.

***

### logger?

> `optional` **logger?**: [`Logger`](https://getpromptscript.dev/api-reference/core/src/interfaces/Logger/index.md)

Defined in: [resolver/src/skills.ts:1819](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/resolver/src/skills.ts#L1819)

Logger for reporting skipped files and resolution decisions.

***

### projectRoot?

> `optional` **projectRoot?**: `string`

Defined in: [resolver/src/skills.ts:1817](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/resolver/src/skills.ts#L1817)

Project root the universal directory sits in. Without it the root is
guessed as the parent of `localPath`, which only holds while `localPath`
is the `.promptscript` directory.

***

### universalDir?

> `optional` **universalDir?**: `string`

Defined in: [resolver/src/skills.ts:1811](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/resolver/src/skills.ts#L1811)

Path to the universal directory for auto-discovering skills and commands.
When set, skills are discovered from `<universalDir>/skills/` and commands from `<universalDir>/commands/`.
Defaults to undefined (disabled). Typically set to `.agents`.