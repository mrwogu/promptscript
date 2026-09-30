# ModelTargetScheme

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ModelTargetScheme

Defined in: [core/src/model-catalog.ts:488](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-catalog.ts#L488)

How an agent target names models in its native `model` field.

Names missing from the catalog are written unchanged on every target:
tools accept names no catalog can list, such as gateway model ids,
`custom:` BYOK models, or Claude Code's `opusplan`.

## Properties

### keepsFloatingAliases

> `readonly` **keepsFloatingAliases**: `boolean`

Defined in: [core/src/model-catalog.ts:497](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-catalog.ts#L497)

Write floating aliases (opus, sonnet, haiku, fable) as-is instead of resolving them

***

### naming

> `readonly` **naming**: `"id"` \| `"displayName"` \| `"apiId"`

Defined in: [core/src/model-catalog.ts:495](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-catalog.ts#L495)

Profile field written for a resolved model: the display name, the API id
(a dated snapshot for older releases), or the dateless profile id

***

### nativeValues?

> `readonly` `optional` **nativeValues?**: `Readonly`\<`Record`\<`string`, `string`\>\>

Defined in: [core/src/model-catalog.ts:501](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-catalog.ts#L501)

Native spellings of values that are not catalog models, keyed by lower-case name

***

### providers?

> `readonly` `optional` **providers?**: readonly `string`[]

Defined in: [core/src/model-catalog.ts:490](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-catalog.ts#L490)

Providers whose models the target runs; every provider when omitted

***

### writesInherit

> `readonly` **writesInherit**: `boolean`

Defined in: [core/src/model-catalog.ts:499](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-catalog.ts#L499)

Write `inherit`; otherwise the field is omitted