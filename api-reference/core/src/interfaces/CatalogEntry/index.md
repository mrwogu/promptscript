# CatalogEntry

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CatalogEntry

Defined in: [core/src/types/manifest.ts:63](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L63)

A single entry in the registry catalog.

## Properties

### dependencies

> **dependencies**: `string`[]

Defined in: [core/src/types/manifest.ts:77](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L77)

Dependencies on other catalog entries

***

### description

> **description**: `string`

Defined in: [core/src/types/manifest.ts:71](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L71)

Description of what this configuration provides

***

### detectionHints?

> `optional` **detectionHints?**: [`DetectionHints`](https://getpromptscript.dev/api-reference/core/src/interfaces/DetectionHints/index.md)

Defined in: [core/src/types/manifest.ts:79](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L79)

Detection hints for auto-suggestion

***

### extends?

> `optional` **extends?**: `string`

Defined in: [core/src/types/manifest.ts:83](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L83)

Registry path of the base skill this entry extends (for overlay detection)

***

### id

> **id**: `string`

Defined in: [core/src/types/manifest.ts:65](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L65)

Unique identifier (e.g., "@stacks/react")

***

### name

> **name**: `string`

Defined in: [core/src/types/manifest.ts:69](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L69)

Human-readable name

***

### path

> **path**: `string`

Defined in: [core/src/types/manifest.ts:67](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L67)

Path to the .prs file relative to registry root

***

### source?

> `optional` **source?**: [`SourceAttribution`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceAttribution/index.md)

Defined in: [core/src/types/manifest.ts:81](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L81)

Source attribution for migrated content

***

### tags

> **tags**: `string`[]

Defined in: [core/src/types/manifest.ts:73](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L73)

Searchable tags

***

### targets

> **targets**: [`ManifestTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ManifestTarget/index.md)[]

Defined in: [core/src/types/manifest.ts:75](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L75)

Supported output targets