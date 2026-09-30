# ResolvedAST

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ResolvedAST

Defined in: [resolver/src/resolver.ts:332](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/resolver.ts#L332)

Result of resolving a PromptScript file.

## Properties

### ~~ast~~

> **ast**: [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md) \| `null`

Defined in: [resolver/src/resolver.ts:344](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/resolver.ts#L344)

Mutable compatibility projection for legacy integrations.

#### Deprecated

Use `canonicalAst` for new consumers.

***

### canonicalAst

> **canonicalAst**: [`CanonicalProgram`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalProgram/index.md) \| `null`

Defined in: [resolver/src/resolver.ts:338](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/resolver.ts#L338)

Immutable canonical AST used by compiler and validator stages.

This is the primary resolved representation.

***

### dependencies?

> `optional` **dependencies?**: `string`[]

Defined in: [resolver/src/resolver.ts:350](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/resolver.ts#L350)

Files and directories read while resolving the AST

***

### errors

> **errors**: [`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md)[]

Defined in: [resolver/src/resolver.ts:352](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/resolver.ts#L352)

List of errors encountered during resolution

***

### provenance

> **provenance**: [`ProvenanceTrace`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceTrace/index.md)

Defined in: [resolver/src/resolver.ts:348](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/resolver.ts#L348)

Public source and composition provenance for final values

***

### sources

> **sources**: `string`[]

Defined in: [resolver/src/resolver.ts:346](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/resolver.ts#L346)

List of all source files involved in resolution