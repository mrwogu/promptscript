# effectiveGovernance()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: effectiveGovernance()

> **effectiveGovernance**(`entry`, `defaults`): [`GovernanceMeta`](https://getpromptscript.dev/api-reference/core/src/interfaces/GovernanceMeta/index.md)

Defined in: [core/src/prompt-definitions.ts:508](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/prompt-definitions.ts#L508)

Effective governance of a prompt: `risk`, `owner` and `domain` from the entry, else
the `@meta` default; `dataClasses` joined; entry `reviewers` replace the default.
Lists are sorted and deduplicated. This is the value a prompt bundle carries.

## Parameters

### entry

[`GovernanceMeta`](https://getpromptscript.dev/api-reference/core/src/interfaces/GovernanceMeta/index.md)

Governance authored on the entry

### defaults

[`GovernanceMeta`](https://getpromptscript.dev/api-reference/core/src/interfaces/GovernanceMeta/index.md)

Governance defaults of `@meta`

## Returns

[`GovernanceMeta`](https://getpromptscript.dev/api-reference/core/src/interfaces/GovernanceMeta/index.md)

The effective governance, without unset fields