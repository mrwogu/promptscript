# collectProvenanceValueEvents()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: collectProvenanceValueEvents()

> **collectProvenanceValueEvents**(`node`, `targetPath`, `source`): [`ProvenanceEvent`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceEvent/index.md)[]

Defined in: [core/src/provenance.ts:589](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/provenance.ts#L589)

Create provenance events for a value replacement, including nested fields
and list entries.

## Parameters

### node

[`ValueNode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ValueNode/index.md)

### targetPath

`string`

### source

[`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

## Returns

[`ProvenanceEvent`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceEvent/index.md)[]