# ProvenanceLink

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ProvenanceLink

Defined in: [core/src/types/provenance.ts:18](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/provenance.ts#L18)

Link in the source chain that led to a resolved value.

## Properties

### alias?

> `readonly` `optional` **alias?**: `string`

Defined in: [core/src/types/provenance.ts:23](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/provenance.ts#L23)

***

### operation

> `readonly` **operation**: `"override"` \| `"inherit"` \| `"use"` \| `"extend"` \| `"compose"`

Defined in: [core/src/types/provenance.ts:19](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/provenance.ts#L19)

***

### reference?

> `readonly` `optional` **reference?**: `string`

Defined in: [core/src/types/provenance.ts:22](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/provenance.ts#L22)

***

### source

> `readonly` **source**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/types/provenance.ts:20](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/provenance.ts#L20)

***

### target?

> `readonly` `optional` **target?**: `string`

Defined in: [core/src/types/provenance.ts:21](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/provenance.ts#L21)