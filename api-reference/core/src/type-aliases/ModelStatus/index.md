# ModelStatus

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: ModelStatus

> **ModelStatus** = `"current"` \| `"legacy"` \| `"deprecated"` \| `"retired"`

Defined in: [core/src/types/models.ts:10](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/models.ts#L10)

Lifecycle status of a model profile.
- `current`: recommended for new instructions
- `legacy`: still served, but superseded by a newer version
- `deprecated`: the provider announced a retirement date
- `retired`: the provider no longer serves the model

Open enum: new values can be added in this version, so handle unknown values.