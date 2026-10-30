# ensureAgentProvenance()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: ensureAgentProvenance()

> **ensureAgentProvenance**(`program`, `source`, `action?`): [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Defined in: [core/src/agent-names.ts:121](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/agent-names.ts#L121)

Add fallback provenance for agent definitions that have no recorded origin.

## Parameters

### program

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

### source

`string`

### action?

`"local"` \| `"imported"` \| `"qualified"` \| `"native"` = `'local'`

## Returns

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)