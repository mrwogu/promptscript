# collectProvenance()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: collectProvenance()

> **collectProvenance**(`input`, `options?`): [`ProvenanceTrace`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceTrace/index.md)

Defined in: [core/src/provenance.ts:615](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/provenance.ts#L615)

Collect source and composition provenance from a legacy or canonical program.

The collector is intentionally separate from AST projections. It can retain
exact canonical entry locations while callers continue consuming the legacy
mutable AST.

## Parameters

### input

[`ProgramInput`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ProgramInput/index.md)

### options?

#### entry?

`string`

#### events?

readonly [`ProvenanceEvent`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceEvent/index.md)[]

#### inherited?

readonly [`ProvenanceEntry`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceEntry/index.md)[]

## Returns

[`ProvenanceTrace`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceTrace/index.md)