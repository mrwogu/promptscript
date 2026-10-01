# collectProvenance()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: collectProvenance()

> **collectProvenance**(`input`, `options?`): [`ProvenanceTrace`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceTrace/index.md)

Defined in: [core/src/provenance.ts:615](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/provenance.ts#L615)

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