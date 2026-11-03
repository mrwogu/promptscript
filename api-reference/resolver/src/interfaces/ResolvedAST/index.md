# ResolvedAST

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ResolvedAST

Defined in: [resolver/src/resolver.ts:363](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/resolver/src/resolver.ts#L363)

Result of resolving a PromptScript file.

## Properties

### ~~ast~~

> **ast**: [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md) \| `null`

Defined in: [resolver/src/resolver.ts:375](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/resolver/src/resolver.ts#L375)

Mutable compatibility projection for legacy integrations.

#### Deprecated

Use `canonicalAst` for new consumers.

***

### canonicalAst

> **canonicalAst**: [`CanonicalProgram`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalProgram/index.md) \| `null`

Defined in: [resolver/src/resolver.ts:369](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/resolver/src/resolver.ts#L369)

Immutable canonical AST used by compiler and validator stages.

This is the primary resolved representation.

***

### dependencies?

> `optional` **dependencies?**: `string`[]

Defined in: [resolver/src/resolver.ts:381](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/resolver/src/resolver.ts#L381)

Files and directories read while resolving the AST

***

### errors

> **errors**: [`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md)[]

Defined in: [resolver/src/resolver.ts:383](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/resolver/src/resolver.ts#L383)

List of errors encountered during resolution

***

### provenance

> **provenance**: [`ProvenanceTrace`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceTrace/index.md)

Defined in: [resolver/src/resolver.ts:379](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/resolver/src/resolver.ts#L379)

Public source and composition provenance for final values

***

### sources

> **sources**: `string`[]

Defined in: [resolver/src/resolver.ts:377](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/resolver/src/resolver.ts#L377)

List of all source files involved in resolution