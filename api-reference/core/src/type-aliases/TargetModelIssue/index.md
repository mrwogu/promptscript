# TargetModelIssue

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: TargetModelIssue

> **TargetModelIssue** = `"unknown-model"` \| `"unsupported-provider"` \| `"invalid-name"`

Defined in: [core/src/model-catalog.ts:581](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/model-catalog.ts#L581)

Why a model reference was omitted or written unchanged.
- `unknown-model`: the catalog has no model with this name, so it is written as-is
- `unsupported-provider`: the target does not run the model's provider, so it is omitted
- `invalid-name`: the name, or the name the profile gives the target, has a line
  break or control character, so it is omitted