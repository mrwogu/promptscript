# prefixProvenance()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: prefixProvenance()

> **prefixProvenance**(`trace`, `link`): [`ProvenanceTrace`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceTrace/index.md)

Defined in: [core/src/provenance.ts:683](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/provenance.ts#L683)

Prefix every history step with an import or inheritance link.

## Parameters

### trace

[`ProvenanceTrace`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceTrace/index.md)

### link

[`ProvenanceLink`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceLink/index.md)

## Returns

[`ProvenanceTrace`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceTrace/index.md)