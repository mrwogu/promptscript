# ProvenanceEvent

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ProvenanceEvent

Defined in: [core/src/types/provenance.ts:73](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/provenance.ts#L73)

Resolver-provided operation appended to a provenance entry.

## Properties

### action

> `readonly` **action**: [`ProvenanceAction`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ProvenanceAction/index.md)

Defined in: [core/src/types/provenance.ts:77](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/provenance.ts#L77)

***

### alias?

> `readonly` `optional` **alias?**: `string`

Defined in: [core/src/types/provenance.ts:82](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/provenance.ts#L82)

***

### chain?

> `readonly` `optional` **chain?**: readonly [`ProvenanceLink`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceLink/index.md)[]

Defined in: [core/src/types/provenance.ts:85](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/provenance.ts#L85)

***

### kind?

> `readonly` `optional` **kind?**: `"block"` \| `"field"` \| `"value"` \| `"list"` \| `"text"` \| `"inline-use"`

Defined in: [core/src/types/provenance.ts:75](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/provenance.ts#L75)

***

### operation

> `readonly` **operation**: [`ProvenanceOperation`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ProvenanceOperation/index.md)

Defined in: [core/src/types/provenance.ts:76](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/provenance.ts#L76)

***

### path

> `readonly` **path**: `string`

Defined in: [core/src/types/provenance.ts:74](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/provenance.ts#L74)

***

### reference?

> `readonly` `optional` **reference?**: `string`

Defined in: [core/src/types/provenance.ts:81](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/provenance.ts#L81)

***

### source

> `readonly` **source**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/types/provenance.ts:78](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/provenance.ts#L78)

***

### strategy?

> `readonly` `optional` **strategy?**: `string`

Defined in: [core/src/types/provenance.ts:79](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/provenance.ts#L79)

***

### target?

> `readonly` `optional` **target?**: `string`

Defined in: [core/src/types/provenance.ts:80](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/provenance.ts#L80)

***

### trace?

> `readonly` `optional` **trace?**: [`ProvenanceTrace`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceTrace/index.md)

Defined in: [core/src/types/provenance.ts:84](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/provenance.ts#L84)

Transitive trace carried by a composition event.