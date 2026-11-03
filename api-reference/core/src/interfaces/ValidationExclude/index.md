# ValidationExclude

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ValidationExclude

Defined in: [core/src/types/config.ts:268](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/config.ts#L268)

Per-import validation exclusion, bound to the commit pinned in promptscript.lock.

Suppression is declared by the consumer, never by the scanned content: an
imported file cannot mute its own scan. When the lockfile pins a different
commit than the one recorded here, the exclude stops applying and validation
fails, so the consumer consciously re-reviews the new content.

## Properties

### commit?

> `optional` **commit?**: `string`

Defined in: [core/src/types/config.ts:272](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/config.ts#L272)

Commit SHA the exclude was reviewed at; must match the lockfile pin

***

### import

> **import**: `string`

Defined in: [core/src/types/config.ts:270](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/config.ts#L270)

Import source as declared in `@use` or as pinned in promptscript.lock

***

### rules

> **rules**: `string`[]

Defined in: [core/src/types/config.ts:274](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/config.ts#L274)

Rule names (e.g. `blocked-patterns`) or IDs (e.g. `PS005`) to skip for this import