# TargetSettingsPermissions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: TargetSettingsPermissions

Defined in: [core/src/types/config.ts:217](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/config.ts#L217)

Permission rules for Claude Code project settings.

## Properties

### allow?

> `optional` **allow?**: `string`[]

Defined in: [core/src/types/config.ts:219](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/config.ts#L219)

Rules that are allowed without a prompt, e.g. `Bash(npm run test:*)`.

***

### ask?

> `optional` **ask?**: `string`[]

Defined in: [core/src/types/config.ts:223](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/config.ts#L223)

Rules that always ask for confirmation.

***

### deny?

> `optional` **deny?**: `string`[]

Defined in: [core/src/types/config.ts:221](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/config.ts#L221)

Rules that are always denied, e.g. `Read(./.env)`.