# ModelResolution

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: ModelResolution

> **ModelResolution** = \{ `kind`: `"inherit"`; \} \| \{ `alias`: `string`; `kind`: `"floating"`; `profile`: [`ModelProfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelProfile/index.md); \} \| \{ `kind`: `"profile"`; `profile`: [`ModelProfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelProfile/index.md); \}

Defined in: [core/src/model-catalog.ts:39](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/core/src/model-catalog.ts#L39)

Catalog match for a model reference.
- `inherit`: keep the model selected in the tool
- `floating`: a floating alias, backed by the newest release of its family
- `profile`: one specific model release