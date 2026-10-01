# ProvenanceTrace

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ProvenanceTrace

Defined in: [core/src/types/provenance.ts:62](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/provenance.ts#L62)

Public provenance model returned with a resolved program.

## Properties

### entries

> `readonly` **entries**: readonly [`ProvenanceEntry`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceEntry/index.md)[]

Defined in: [core/src/types/provenance.ts:67](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/provenance.ts#L67)

Stable, path-ordered provenance entries.

***

### entry

> `readonly` **entry**: `string`

Defined in: [core/src/types/provenance.ts:65](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/provenance.ts#L65)

Entry file used to produce the resolved program.

***

### version

> `readonly` **version**: `1`

Defined in: [core/src/types/provenance.ts:63](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/provenance.ts#L63)