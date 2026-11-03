# PolicySubject

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PolicySubject

Defined in: [core/src/types/policy.ts:286](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/policy.ts#L286)

A prompt as prompt policies see it, built from source or from a release bundle.

## Properties

### governance

> **governance**: [`GovernanceMeta`](https://getpromptscript.dev/api-reference/core/src/interfaces/GovernanceMeta/index.md)

Defined in: [core/src/types/policy.ts:290](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/policy.ts#L290)

Effective governance

***

### id

> **id**: `string`

Defined in: [core/src/types/policy.ts:288](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/policy.ts#L288)

Prompt id, `<@meta.id>/<key>`

***

### inputs

> **inputs**: `Record`\<`string`, \{ `options?`: `string`[]; `type`: [`PromptScalarType`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PromptScalarType/index.md); \}\>

Defined in: [core/src/types/policy.ts:294](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/policy.ts#L294)

Inputs by name

***

### loc?

> `optional` **loc?**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/types/policy.ts:298](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/policy.ts#L298)

The entry, or the bundle file

***

### model?

> `optional` **model?**: `object`

Defined in: [core/src/types/policy.ts:292](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/policy.ts#L292)

Model reference and the catalog profile it resolved to

#### profile?

> `optional` **profile?**: `string`

#### ref

> **ref**: `string`

***

### texts

> **texts**: `object`[]

Defined in: [core/src/types/policy.ts:296](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/policy.ts#L296)

Message texts the content checks scan

#### content

> **content**: `string`

#### role

> **role**: `"system"` \| `"user"`