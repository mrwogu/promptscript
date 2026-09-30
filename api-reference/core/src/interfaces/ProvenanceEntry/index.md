# ProvenanceEntry

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ProvenanceEntry

Defined in: [core/src/types/provenance.ts:45](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/provenance.ts#L45)

Provenance for one final block or nested value path.

## Properties

### history

> `readonly` **history**: readonly [`ProvenanceStep`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceStep/index.md)[]

Defined in: [core/src/types/provenance.ts:56](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/provenance.ts#L56)

Ordered declaration and composition history for the final value.

***

### kind

> `readonly` **kind**: `"block"` \| `"field"` \| `"value"` \| `"list"` \| `"text"` \| `"inline-use"`

Defined in: [core/src/types/provenance.ts:52](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/provenance.ts#L52)

Kind of final value represented by the path.

***

### path

> `readonly` **path**: `string`

Defined in: [core/src/types/provenance.ts:50](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/provenance.ts#L50)

Canonical path. Blocks use `block`, fields use `block.field`, and list
entries use `block[0]` or `block.field[0]`.

***

### source

> `readonly` **source**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/types/provenance.ts:54](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/provenance.ts#L54)

Source location of the final value declaration.