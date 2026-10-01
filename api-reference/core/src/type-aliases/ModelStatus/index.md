# ModelStatus

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: ModelStatus

> **ModelStatus** = `"current"` \| `"legacy"` \| `"deprecated"` \| `"retired"`

Defined in: [core/src/types/models.ts:8](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/models.ts#L8)

Lifecycle status of a model profile.
- `current`: recommended for new instructions
- `legacy`: still served, but superseded by a newer version
- `deprecated`: the provider announced a retirement date
- `retired`: the provider no longer serves the model