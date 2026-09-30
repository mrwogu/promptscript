# ModelSet

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ModelSet

Defined in: [core/src/model-catalog.ts:441](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-catalog.ts#L441)

Model set from `models.supported`, resolved against a catalog.

## Properties

### floatingAliases

> `readonly` **floatingAliases**: `ReadonlySet`\<`string`\>

Defined in: [core/src/model-catalog.ts:445](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-catalog.ts#L445)

Floating aliases in the set

***

### profileIds

> `readonly` **profileIds**: `ReadonlySet`\<`string`\>

Defined in: [core/src/model-catalog.ts:443](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-catalog.ts#L443)

Profile ids in the set, including the releases behind floating aliases

***

### unknown

> `readonly` **unknown**: readonly `string`[]

Defined in: [core/src/model-catalog.ts:447](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/model-catalog.ts#L447)

Entries that match no catalog model