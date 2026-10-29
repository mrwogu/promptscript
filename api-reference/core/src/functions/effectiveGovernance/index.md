# effectiveGovernance()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: effectiveGovernance()

> **effectiveGovernance**(`entry`, `defaults`): [`GovernanceMeta`](https://getpromptscript.dev/api-reference/core/src/interfaces/GovernanceMeta/index.md)

Defined in: [core/src/prompt-definitions.ts:508](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/prompt-definitions.ts#L508)

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