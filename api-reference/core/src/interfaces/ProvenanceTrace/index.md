# ProvenanceTrace

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ProvenanceTrace

Defined in: [core/src/types/provenance.ts:62](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/provenance.ts#L62)

Public provenance model returned with a resolved program.

## Properties

### entries

> `readonly` **entries**: readonly [`ProvenanceEntry`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceEntry/index.md)[]

Defined in: [core/src/types/provenance.ts:67](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/provenance.ts#L67)

Stable, path-ordered provenance entries.

***

### entry

> `readonly` **entry**: `string`

Defined in: [core/src/types/provenance.ts:65](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/provenance.ts#L65)

Entry file used to produce the resolved program.

***

### version

> `readonly` **version**: `1`

Defined in: [core/src/types/provenance.ts:63](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/provenance.ts#L63)