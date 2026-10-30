# TargetModelIssue

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: TargetModelIssue

> **TargetModelIssue** = `"unknown-model"` \| `"unsupported-provider"` \| `"invalid-name"`

Defined in: [core/src/model-catalog.ts:581](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/model-catalog.ts#L581)

Why a model reference was omitted or written unchanged.
- `unknown-model`: the catalog has no model with this name, so it is written as-is
- `unsupported-provider`: the target does not run the model's provider, so it is omitted
- `invalid-name`: the name, or the name the profile gives the target, has a line
  break or control character, so it is omitted