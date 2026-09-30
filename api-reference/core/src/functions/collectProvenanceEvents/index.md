# collectProvenanceEvents()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: collectProvenanceEvents()

> **collectProvenanceEvents**(`body`, `targetPath`, `operation`, `source`, `action`, `strategy?`, `options?`): [`ProvenanceEvent`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceEvent/index.md)[]

Defined in: [core/src/provenance.ts:420](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/provenance.ts#L420)

Create operation events for an extension or replacement body.

Events are separate from AST nodes so internal tracing never reaches
formatters unless a formatter explicitly consumes the public trace.

## Parameters

### body

[`BlockBody`](https://getpromptscript.dev/api-reference/core/src/interfaces/BlockBody/index.md) \| `undefined`

### targetPath

`string`

### operation

`"override"` \| `"extend"`

### source

[`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

### action

`"merged"` \| `"replaced"`

### strategy?

`string`

### options?

[`ProvenanceEventOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceEventOptions/index.md) = `{}`

## Returns

[`ProvenanceEvent`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceEvent/index.md)[]