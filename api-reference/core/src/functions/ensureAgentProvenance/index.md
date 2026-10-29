# ensureAgentProvenance()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: ensureAgentProvenance()

> **ensureAgentProvenance**(`program`, `source`, `action?`): [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Defined in: [core/src/agent-names.ts:121](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/agent-names.ts#L121)

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