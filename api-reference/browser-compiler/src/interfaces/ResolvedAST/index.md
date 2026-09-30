# ResolvedAST

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ResolvedAST

Defined in: [browser-compiler/src/resolver.ts:218](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/resolver.ts#L218)

Result of resolving a PromptScript file.

## Properties

### ~~ast~~

> **ast**: [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md) \| `null`

Defined in: [browser-compiler/src/resolver.ts:230](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/resolver.ts#L230)

Mutable compatibility projection for legacy integrations.

#### Deprecated

Use `canonicalAst` for new consumers.

***

### canonicalAst

> **canonicalAst**: [`CanonicalProgram`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalProgram/index.md) \| `null`

Defined in: [browser-compiler/src/resolver.ts:224](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/resolver.ts#L224)

Immutable canonical AST used by compiler and validator stages.

This is the primary resolved representation.

***

### errors

> **errors**: [`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md)[]

Defined in: [browser-compiler/src/resolver.ts:236](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/resolver.ts#L236)

List of errors encountered during resolution

***

### provenance

> **provenance**: [`ProvenanceTrace`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceTrace/index.md)

Defined in: [browser-compiler/src/resolver.ts:234](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/resolver.ts#L234)

Public source and composition provenance for final values

***

### sources

> **sources**: `string`[]

Defined in: [browser-compiler/src/resolver.ts:232](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/browser-compiler/src/resolver.ts#L232)

List of all source files involved in resolution