# findAgentConflicts()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: findAgentConflicts()

> **findAgentConflicts**(`target`, `source`, `sourceImportPath`, `importLocation?`): [`AgentConflict`](https://getpromptscript.dev/api-reference/core/src/interfaces/AgentConflict/index.md)[]

Defined in: [core/src/agent-names.ts:151](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/agent-names.ts#L151)

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