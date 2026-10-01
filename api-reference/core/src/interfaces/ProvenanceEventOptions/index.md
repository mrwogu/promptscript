# ProvenanceEventOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ProvenanceEventOptions

Defined in: [core/src/provenance.ts:356](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/provenance.ts#L356)

## Properties

### baseBody?

> `readonly` `optional` **baseBody?**: [`BlockBody`](https://getpromptscript.dev/api-reference/core/src/interfaces/BlockBody/index.md)

Defined in: [core/src/provenance.ts:362](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/provenance.ts#L362)

Base canonical body used to suppress duplicate append events.

***

### baseContent?

> `readonly` `optional` **baseContent?**: [`BlockContent`](https://getpromptscript.dev/api-reference/core/src/type-aliases/BlockContent/index.md)

Defined in: [core/src/provenance.ts:364](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/provenance.ts#L364)

Base content used to suppress duplicate append events.

***

### finalBody?

> `readonly` `optional` **finalBody?**: [`BlockBody`](https://getpromptscript.dev/api-reference/core/src/interfaces/BlockBody/index.md)

Defined in: [core/src/provenance.ts:360](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/provenance.ts#L360)

Final canonical body used to preserve source locations during mapping.

***

### finalContent?

> `readonly` `optional` **finalContent?**: [`BlockContent`](https://getpromptscript.dev/api-reference/core/src/type-aliases/BlockContent/index.md)

Defined in: [core/src/provenance.ts:358](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/provenance.ts#L358)

Final content used to map incoming values to final canonical positions.

***

### resolveDetails?

> `readonly` `optional` **resolveDetails?**: (`path`, `node`) => `Pick`\<[`ProvenanceEvent`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceEvent/index.md), `"action"` \| `"strategy"`\> \| `undefined`

Defined in: [core/src/provenance.ts:366](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/provenance.ts#L366)

Per-path strategy override for skill-aware merges.

#### Parameters

##### path

`string`

##### node

[`ValueNode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ValueNode/index.md)

#### Returns

`Pick`\<[`ProvenanceEvent`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceEvent/index.md), `"action"` \| `"strategy"`\> \| `undefined`