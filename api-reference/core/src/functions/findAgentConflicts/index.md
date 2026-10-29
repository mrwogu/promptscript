# findAgentConflicts()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: findAgentConflicts()

> **findAgentConflicts**(`target`, `source`, `sourceImportPath`, `importLocation?`): [`AgentConflict`](https://getpromptscript.dev/api-reference/core/src/interfaces/AgentConflict/index.md)[]

Defined in: [core/src/agent-names.ts:151](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/agent-names.ts#L151)

Collect conflicting agent definitions before a merge.

## Parameters

### target

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

### source

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

### sourceImportPath

`string`

### importLocation?

[`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

## Returns

[`AgentConflict`](https://getpromptscript.dev/api-reference/core/src/interfaces/AgentConflict/index.md)[]