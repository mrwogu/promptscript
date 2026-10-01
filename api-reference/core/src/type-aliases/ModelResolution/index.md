# ModelResolution

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: ModelResolution

> **ModelResolution** = \{ `kind`: `"inherit"`; \} \| \{ `alias`: `string`; `kind`: `"floating"`; `profile`: [`ModelProfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelProfile/index.md); \} \| \{ `kind`: `"profile"`; `profile`: [`ModelProfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelProfile/index.md); \}

Defined in: [core/src/model-catalog.ts:39](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/model-catalog.ts#L39)

Catalog match for a model reference.
- `inherit`: keep the model selected in the tool
- `floating`: a floating alias, backed by the newest release of its family
- `profile`: one specific model release