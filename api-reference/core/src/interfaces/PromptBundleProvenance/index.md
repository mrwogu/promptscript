# PromptBundleProvenance

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptBundleProvenance

Defined in: [core/src/types/prompt-bundle.ts:96](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/prompt-bundle.ts#L96)

Provenance of a prompt bundle. Informational, outside the hash.

## Properties

### entry

> **entry**: `string`

Defined in: [core/src/types/prompt-bundle.ts:101](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/prompt-bundle.ts#L101)

Entry file of the compilation.

#### Example

```ts
".promptscript/project.prs"
```

***

### segments

> **segments**: [`PromptBundleSegment`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptBundleSegment/index.md)[]

Defined in: [core/src/types/prompt-bundle.ts:103](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/prompt-bundle.ts#L103)

Message segments with their source files