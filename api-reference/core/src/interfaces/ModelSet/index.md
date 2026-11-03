# ModelSet

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ModelSet

Defined in: [core/src/model-catalog.ts:468](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/model-catalog.ts#L468)

Model set from `models.supported`, resolved against a catalog.

## Properties

### floatingAliases

> `readonly` **floatingAliases**: `ReadonlySet`\<`string`\>

Defined in: [core/src/model-catalog.ts:472](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/model-catalog.ts#L472)

Floating aliases in the set

***

### profileIds

> `readonly` **profileIds**: `ReadonlySet`\<`string`\>

Defined in: [core/src/model-catalog.ts:470](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/model-catalog.ts#L470)

Profile ids in the set, including the releases behind floating aliases

***

### unknown

> `readonly` **unknown**: readonly `string`[]

Defined in: [core/src/model-catalog.ts:474](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/model-catalog.ts#L474)

Entries that match no catalog model