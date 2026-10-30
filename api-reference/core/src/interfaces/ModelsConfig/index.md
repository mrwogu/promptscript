# ModelsConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ModelsConfig

Defined in: [core/src/types/models.ts:123](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/models.ts#L123)

Model catalog configuration (`models` in promptscript.yaml).

## Properties

### profiles?

> `optional` **profiles?**: `Record`\<`string`, [`ModelProfileInput`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelProfileInput/index.md)\>

Defined in: [core/src/types/models.ts:135](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/models.ts#L135)

Custom model profiles, or overrides of built-in profiles, keyed by profile id.

***

### supported?

> `optional` **supported?**: `string`[]

Defined in: [core/src/types/models.ts:130](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/models.ts#L130)

Model set the instructions are written and tested for.
Entries are profile ids, aliases, or provider model identifiers.
Validation reports agents and skills pinned outside this set.

#### Example

```ts
['claude-opus-5-5', 'gpt-6-sol']
```