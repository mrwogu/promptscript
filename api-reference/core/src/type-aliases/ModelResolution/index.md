# ModelResolution

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: ModelResolution

> **ModelResolution** = \{ `kind`: `"inherit"`; \} \| \{ `alias`: `string`; `kind`: `"floating"`; `profile`: [`ModelProfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelProfile/index.md); \} \| \{ `kind`: `"profile"`; `profile`: [`ModelProfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelProfile/index.md); \}

Defined in: [core/src/model-catalog.ts:45](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/model-catalog.ts#L45)

Catalog match for a model reference.
- `inherit`: keep the model selected in the tool
- `floating`: a floating alias, backed by the newest release of its family
- `profile`: one specific model release