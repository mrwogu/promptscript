# SourcedSection

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: SourcedSection

Defined in: [importer/src/merger.ts:3](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/importer/src/merger.ts#L3)

## Extends

- [`ScoredSection`](https://getpromptscript.dev/api-reference/importer/src/interfaces/ScoredSection/index.md)

## Properties

### confidence

> **confidence**: `number`

Defined in: [importer/src/confidence.ts:11](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/importer/src/confidence.ts#L11)

#### Inherited from

[`ScoredSection`](https://getpromptscript.dev/api-reference/importer/src/interfaces/ScoredSection/index.md).[`confidence`](https://getpromptscript.dev/api-reference/importer/src/interfaces/ScoredSection/index.md#confidence)

***

### content

> **content**: `string`

Defined in: [importer/src/confidence.ts:9](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/importer/src/confidence.ts#L9)

#### Inherited from

[`ScoredSection`](https://getpromptscript.dev/api-reference/importer/src/interfaces/ScoredSection/index.md).[`content`](https://getpromptscript.dev/api-reference/importer/src/interfaces/ScoredSection/index.md#content)

***

### heading

> **heading**: `string`

Defined in: [importer/src/confidence.ts:8](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/importer/src/confidence.ts#L8)

#### Inherited from

[`ScoredSection`](https://getpromptscript.dev/api-reference/importer/src/interfaces/ScoredSection/index.md).[`heading`](https://getpromptscript.dev/api-reference/importer/src/interfaces/ScoredSection/index.md#heading)

***

### level

> **level**: [`ConfidenceLevel`](https://getpromptscript.dev/api-reference/importer/src/enumerations/ConfidenceLevel/index.md)

Defined in: [importer/src/confidence.ts:12](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/importer/src/confidence.ts#L12)

#### Inherited from

[`ScoredSection`](https://getpromptscript.dev/api-reference/importer/src/interfaces/ScoredSection/index.md).[`level`](https://getpromptscript.dev/api-reference/importer/src/interfaces/ScoredSection/index.md#level)

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `unknown`\>

Defined in: [importer/src/confidence.ts:14](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/importer/src/confidence.ts#L14)

Optional metadata propagated from parser.

#### Inherited from

[`ScoredSection`](https://getpromptscript.dev/api-reference/importer/src/interfaces/ScoredSection/index.md).[`metadata`](https://getpromptscript.dev/api-reference/importer/src/interfaces/ScoredSection/index.md#metadata)

***

### source

> **source**: `string`

Defined in: [importer/src/merger.ts:4](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/importer/src/merger.ts#L4)

***

### targetBlock

> **targetBlock**: `string`

Defined in: [importer/src/confidence.ts:10](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/importer/src/confidence.ts#L10)

#### Inherited from

[`ScoredSection`](https://getpromptscript.dev/api-reference/importer/src/interfaces/ScoredSection/index.md).[`targetBlock`](https://getpromptscript.dev/api-reference/importer/src/interfaces/ScoredSection/index.md#targetblock)