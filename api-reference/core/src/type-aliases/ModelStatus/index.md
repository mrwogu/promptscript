# ModelStatus

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: ModelStatus

> **ModelStatus** = `"current"` \| `"legacy"` \| `"deprecated"` \| `"retired"`

Defined in: [core/src/types/models.ts:8](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/models.ts#L8)

Lifecycle status of a model profile.
- `current`: recommended for new instructions
- `legacy`: still served, but superseded by a newer version
- `deprecated`: the provider announced a retirement date
- `retired`: the provider no longer serves the model