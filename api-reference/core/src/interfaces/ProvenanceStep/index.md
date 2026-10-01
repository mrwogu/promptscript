# ProvenanceStep

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ProvenanceStep

Defined in: [core/src/types/provenance.ts:29](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/provenance.ts#L29)

One operation recorded for a resolved value.

## Properties

### action

> `readonly` **action**: [`ProvenanceAction`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ProvenanceAction/index.md)

Defined in: [core/src/types/provenance.ts:31](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/provenance.ts#L31)

***

### alias?

> `readonly` `optional` **alias?**: `string`

Defined in: [core/src/types/provenance.ts:36](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/provenance.ts#L36)

***

### chain

> `readonly` **chain**: readonly [`ProvenanceLink`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceLink/index.md)[]

Defined in: [core/src/types/provenance.ts:37](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/provenance.ts#L37)

***

### operation

> `readonly` **operation**: [`ProvenanceOperation`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ProvenanceOperation/index.md)

Defined in: [core/src/types/provenance.ts:30](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/provenance.ts#L30)

***

### reference?

> `readonly` `optional` **reference?**: `string`

Defined in: [core/src/types/provenance.ts:35](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/provenance.ts#L35)

***

### source

> `readonly` **source**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/types/provenance.ts:32](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/provenance.ts#L32)

***

### strategy?

> `readonly` `optional` **strategy?**: `string`

Defined in: [core/src/types/provenance.ts:33](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/provenance.ts#L33)

***

### target?

> `readonly` `optional` **target?**: `string`

Defined in: [core/src/types/provenance.ts:34](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/provenance.ts#L34)

***

### trace?

> `readonly` `optional` **trace?**: [`ProvenanceTrace`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceTrace/index.md)

Defined in: [core/src/types/provenance.ts:39](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/provenance.ts#L39)

Transitive trace carried by a composition step.