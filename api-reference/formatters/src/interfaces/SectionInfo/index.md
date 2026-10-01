# SectionInfo

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: SectionInfo

Defined in: [formatters/src/section-registry.ts:12](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/section-registry.ts#L12)

Section metadata for documentation and validation.

## Properties

### description

> **description**: `string`

Defined in: [formatters/src/section-registry.ts:18](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/section-registry.ts#L18)

Description of what this section contains

***

### id

> **id**: `string`

Defined in: [formatters/src/section-registry.ts:14](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/section-registry.ts#L14)

Section identifier (kebab-case)

***

### name

> **name**: `string`

Defined in: [formatters/src/section-registry.ts:16](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/section-registry.ts#L16)

Human-readable name

***

### required

> **required**: `boolean`

Defined in: [formatters/src/section-registry.ts:22](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/section-registry.ts#L22)

Whether this section is required for complete output

***

### sourceBlocks

> **sourceBlocks**: `string`[]

Defined in: [formatters/src/section-registry.ts:20](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/section-registry.ts#L20)

Source block(s) in PRS that provide data for this section