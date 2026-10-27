# effectiveGovernance()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: effectiveGovernance()

> **effectiveGovernance**(`entry`, `defaults`): [`GovernanceMeta`](https://getpromptscript.dev/api-reference/core/src/interfaces/GovernanceMeta/index.md)

Defined in: [core/src/prompt-definitions.ts:508](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/prompt-definitions.ts#L508)

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