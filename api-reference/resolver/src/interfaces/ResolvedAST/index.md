# ResolvedAST

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ResolvedAST

Defined in: [resolver/src/resolver.ts:354](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/resolver/src/resolver.ts#L354)

Result of resolving a PromptScript file.

## Properties

### ~~ast~~

> **ast**: [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md) \| `null`

Defined in: [resolver/src/resolver.ts:366](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/resolver/src/resolver.ts#L366)

Mutable compatibility projection for legacy integrations.

#### Deprecated

Use `canonicalAst` for new consumers.

***

### canonicalAst

> **canonicalAst**: [`CanonicalProgram`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalProgram/index.md) \| `null`

Defined in: [resolver/src/resolver.ts:360](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/resolver/src/resolver.ts#L360)

Immutable canonical AST used by compiler and validator stages.

This is the primary resolved representation.

***

### dependencies?

> `optional` **dependencies?**: `string`[]

Defined in: [resolver/src/resolver.ts:372](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/resolver/src/resolver.ts#L372)

Files and directories read while resolving the AST

***

### errors

> **errors**: [`ResolveError`](https://getpromptscript.dev/api-reference/core/src/classes/ResolveError/index.md)[]

Defined in: [resolver/src/resolver.ts:374](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/resolver/src/resolver.ts#L374)

List of errors encountered during resolution

***

### provenance

> **provenance**: [`ProvenanceTrace`](https://getpromptscript.dev/api-reference/core/src/interfaces/ProvenanceTrace/index.md)

Defined in: [resolver/src/resolver.ts:370](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/resolver/src/resolver.ts#L370)

Public source and composition provenance for final values

***

### sources

> **sources**: `string`[]

Defined in: [resolver/src/resolver.ts:368](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/resolver/src/resolver.ts#L368)

List of all source files involved in resolution