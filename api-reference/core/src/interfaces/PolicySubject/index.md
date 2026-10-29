# PolicySubject

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PolicySubject

Defined in: [core/src/types/policy.ts:247](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L247)

A prompt as prompt policies see it, built from source or from a release bundle.

## Properties

### governance

> **governance**: [`GovernanceMeta`](https://getpromptscript.dev/api-reference/core/src/interfaces/GovernanceMeta/index.md)

Defined in: [core/src/types/policy.ts:251](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L251)

Effective governance

***

### id

> **id**: `string`

Defined in: [core/src/types/policy.ts:249](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L249)

Prompt id, `<@meta.id>/<key>`

***

### inputs

> **inputs**: `Record`\<`string`, \{ `options?`: `string`[]; `type`: [`PromptScalarType`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PromptScalarType/index.md); \}\>

Defined in: [core/src/types/policy.ts:255](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L255)

Inputs by name

***

### loc?

> `optional` **loc?**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/types/policy.ts:259](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L259)

The entry, or the bundle file

***

### model?

> `optional` **model?**: `object`

Defined in: [core/src/types/policy.ts:253](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L253)

Model reference and the catalog profile it resolved to

#### profile?

> `optional` **profile?**: `string`

#### ref

> **ref**: `string`

***

### texts

> **texts**: `object`[]

Defined in: [core/src/types/policy.ts:257](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L257)

Message texts the content checks scan

#### content

> **content**: `string`

#### role

> **role**: `"system"` \| `"user"`