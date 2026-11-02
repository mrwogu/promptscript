# ModelTargetScheme

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ModelTargetScheme

Defined in: [core/src/model-catalog.ts:515](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/model-catalog.ts#L515)

How an agent target names models in its native `model` field.

Names missing from the catalog are written unchanged on every target:
tools accept names no catalog can list, such as gateway model ids,
`custom:` BYOK models, or Claude Code's `opusplan`.

## Properties

### keepsFloatingAliases

> `readonly` **keepsFloatingAliases**: `boolean`

Defined in: [core/src/model-catalog.ts:524](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/model-catalog.ts#L524)

Write floating aliases (opus, sonnet, haiku, fable) as-is instead of resolving them

***

### naming

> `readonly` **naming**: `"id"` \| `"displayName"` \| `"apiId"`

Defined in: [core/src/model-catalog.ts:522](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/model-catalog.ts#L522)

Profile field written for a resolved model: the display name, the API id
(a dated snapshot for older releases), or the dateless profile id

***

### nativeValues?

> `readonly` `optional` **nativeValues?**: `Readonly`\<`Record`\<`string`, `string`\>\>

Defined in: [core/src/model-catalog.ts:528](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/model-catalog.ts#L528)

Native spellings of values that are not catalog models, keyed by lower-case name

***

### providers?

> `readonly` `optional` **providers?**: readonly `string`[]

Defined in: [core/src/model-catalog.ts:517](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/model-catalog.ts#L517)

Providers whose models the target runs; every provider when omitted

***

### writesInherit

> `readonly` **writesInherit**: `boolean`

Defined in: [core/src/model-catalog.ts:526](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/model-catalog.ts#L526)

Write `inherit`; otherwise the field is omitted