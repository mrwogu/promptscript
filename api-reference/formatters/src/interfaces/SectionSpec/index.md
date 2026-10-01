# SectionSpec

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: SectionSpec

Defined in: [formatters/src/parity-matrix.ts:39](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/parity-matrix.ts#L39)

Section specification in the parity matrix.

## Properties

### contentPatterns?

> `optional` **contentPatterns?**: `RegExp`[]

Defined in: [formatters/src/parity-matrix.ts:53](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/parity-matrix.ts#L53)

Expected content patterns (regex) to validate output

***

### description

> **description**: `string`

Defined in: [formatters/src/parity-matrix.ts:45](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/parity-matrix.ts#L45)

Description of section purpose

***

### headerVariations

> **headerVariations**: `Partial`\<`Record`\<[`FormatterName`](https://getpromptscript.dev/api-reference/browser-compiler/src/type-aliases/FormatterName/index.md), `string` \| `string`[]\>\>

Defined in: [formatters/src/parity-matrix.ts:55](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/parity-matrix.ts#L55)

Section header variations across formatters

***

### id

> **id**: `string`

Defined in: [formatters/src/parity-matrix.ts:41](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/parity-matrix.ts#L41)

Unique section identifier

***

### name

> **name**: `string`

Defined in: [formatters/src/parity-matrix.ts:43](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/parity-matrix.ts#L43)

Human-readable section name

***

### optionalFor

> **optionalFor**: [`KnownTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/KnownTarget/index.md)[]

Defined in: [formatters/src/parity-matrix.ts:51](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/parity-matrix.ts#L51)

Formatters that MAY implement this section

***

### requiredBy

> **requiredBy**: [`KnownTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/KnownTarget/index.md)[]

Defined in: [formatters/src/parity-matrix.ts:49](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/parity-matrix.ts#L49)

Formatters that MUST implement this section

***

### sources

> **sources**: [`SourceBlockConfig`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SourceBlockConfig/index.md)[]

Defined in: [formatters/src/parity-matrix.ts:47](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/parity-matrix.ts#L47)

Source blocks that provide data for this section