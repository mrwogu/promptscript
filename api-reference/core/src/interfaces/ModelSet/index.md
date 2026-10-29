# ModelSet

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ModelSet

Defined in: [core/src/model-catalog.ts:463](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/model-catalog.ts#L463)

Model set from `models.supported`, resolved against a catalog.

## Properties

### floatingAliases

> `readonly` **floatingAliases**: `ReadonlySet`\<`string`\>

Defined in: [core/src/model-catalog.ts:467](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/model-catalog.ts#L467)

Floating aliases in the set

***

### profileIds

> `readonly` **profileIds**: `ReadonlySet`\<`string`\>

Defined in: [core/src/model-catalog.ts:465](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/model-catalog.ts#L465)

Profile ids in the set, including the releases behind floating aliases

***

### unknown

> `readonly` **unknown**: readonly `string`[]

Defined in: [core/src/model-catalog.ts:469](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/model-catalog.ts#L469)

Entries that match no catalog model