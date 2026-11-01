# TargetModelIssue

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: TargetModelIssue

> **TargetModelIssue** = `"unknown-model"` \| `"unsupported-provider"` \| `"invalid-name"`

Defined in: [core/src/model-catalog.ts:581](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/model-catalog.ts#L581)

Why a model reference was omitted or written unchanged.
- `unknown-model`: the catalog has no model with this name, so it is written as-is
- `unsupported-provider`: the target does not run the model's provider, so it is omitted
- `invalid-name`: the name, or the name the profile gives the target, has a line
  break or control character, so it is omitted