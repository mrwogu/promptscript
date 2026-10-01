# ValidationExclude

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ValidationExclude

Defined in: [core/src/types/config.ts:195](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/config.ts#L195)

Per-import validation exclusion, bound to the commit pinned in promptscript.lock.

Suppression is declared by the consumer, never by the scanned content: an
imported file cannot mute its own scan. When the lockfile pins a different
commit than the one recorded here, the exclude stops applying and validation
fails, so the consumer consciously re-reviews the new content.

## Properties

### commit?

> `optional` **commit?**: `string`

Defined in: [core/src/types/config.ts:199](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/config.ts#L199)

Commit SHA the exclude was reviewed at; must match the lockfile pin

***

### import

> **import**: `string`

Defined in: [core/src/types/config.ts:197](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/config.ts#L197)

Import source as declared in `@use` or as pinned in promptscript.lock

***

### rules

> **rules**: `string`[]

Defined in: [core/src/types/config.ts:201](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/config.ts#L201)

Rule names (e.g. `blocked-patterns`) or IDs (e.g. `PS005`) to skip for this import