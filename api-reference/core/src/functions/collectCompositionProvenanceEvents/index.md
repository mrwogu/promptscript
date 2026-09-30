# collectCompositionProvenanceEvents()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: collectCompositionProvenanceEvents()

> **collectCompositionProvenanceEvents**(`phases`, `inlineUses`, `resolveSource`, `skillName`, `finalProperties?`): [`ProvenanceEvent`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceEvent/index.md)[]

Defined in: [core/src/provenance.ts:508](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/provenance.ts#L508)

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