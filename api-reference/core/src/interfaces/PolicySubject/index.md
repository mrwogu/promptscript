# PolicySubject

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PolicySubject

Defined in: [core/src/types/policy.ts:282](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/policy.ts#L282)

A prompt as prompt policies see it, built from source or from a release bundle.

## Properties

### governance

> **governance**: [`GovernanceMeta`](https://getpromptscript.dev/api-reference/core/src/interfaces/GovernanceMeta/index.md)

Defined in: [core/src/types/policy.ts:286](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/policy.ts#L286)

Effective governance

***

### id

> **id**: `string`

Defined in: [core/src/types/policy.ts:284](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/policy.ts#L284)

Prompt id, `<@meta.id>/<key>`

***

### inputs

> **inputs**: `Record`\<`string`, \{ `options?`: `string`[]; `type`: [`PromptScalarType`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PromptScalarType/index.md); \}\>

Defined in: [core/src/types/policy.ts:290](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/policy.ts#L290)

Inputs by name

***

### loc?

> `optional` **loc?**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/types/policy.ts:294](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/policy.ts#L294)

The entry, or the bundle file

***

### model?

> `optional` **model?**: `object`

Defined in: [core/src/types/policy.ts:288](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/policy.ts#L288)

Model reference and the catalog profile it resolved to

#### profile?

> `optional` **profile?**: `string`

#### ref

> **ref**: `string`

***

### texts

> **texts**: `object`[]

Defined in: [core/src/types/policy.ts:292](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/policy.ts#L292)

Message texts the content checks scan

#### content

> **content**: `string`

#### role

> **role**: `"system"` \| `"user"`