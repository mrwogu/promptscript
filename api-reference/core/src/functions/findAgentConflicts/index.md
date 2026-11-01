# findAgentConflicts()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: findAgentConflicts()

> **findAgentConflicts**(`target`, `source`, `sourceImportPath`, `importLocation?`): [`AgentConflict`](https://getpromptscript.dev/api-reference/core/src/interfaces/AgentConflict/index.md)[]

Defined in: [core/src/agent-names.ts:151](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/agent-names.ts#L151)

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