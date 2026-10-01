# ModelsConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ModelsConfig

Defined in: [core/src/types/models.ts:97](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L97)

Model catalog configuration (`models` in promptscript.yaml).

## Properties

### profiles?

> `optional` **profiles?**: `Record`\<`string`, [`ModelProfileInput`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelProfileInput/index.md)\>

Defined in: [core/src/types/models.ts:109](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L109)

Custom model profiles, or overrides of built-in profiles, keyed by profile id.

***

### supported?

> `optional` **supported?**: `string`[]

Defined in: [core/src/types/models.ts:104](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L104)

Model set the instructions are written and tested for.
Entries are profile ids, aliases, or provider model identifiers.
Validation reports agents and skills pinned outside this set.

#### Example

```ts
['claude-opus-5-5', 'gpt-6-sol']
```