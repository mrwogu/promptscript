# collectCompositionProvenanceEvents()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: collectCompositionProvenanceEvents()

> **collectCompositionProvenanceEvents**(`phases`, `inlineUses`, `resolveSource`, `skillName`, `finalProperties?`): [`ProvenanceEvent`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceEvent/index.md)[]

Defined in: [core/src/provenance.ts:508](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/provenance.ts#L508)

Create provenance events for composed skill properties.

Composition metadata is matched to inline uses by resolved source path.
Positional fallback would attribute malformed metadata to the wrong use.

## Parameters

### phases

readonly `unknown`[]

### inlineUses

readonly `object`[]

### resolveSource

(`declaration`) => `string`

### skillName

`string`

### finalProperties?

readonly `string`[]

## Returns

[`ProvenanceEvent`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceEvent/index.md)[]