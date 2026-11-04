# GovernanceMeta

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: GovernanceMeta

Defined in: [core/src/types/prompts.ts:22](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/prompts.ts#L22)

Governance metadata of a prompt.

## Properties

### dataClasses?

> `optional` **dataClasses?**: `string`[]

Defined in: [core/src/types/prompts.ts:30](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/prompts.ts#L30)

Classes of data the prompt handles (e.g. 'pii')

***

### domain?

> `optional` **domain?**: `string`

Defined in: [core/src/types/prompts.ts:28](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/prompts.ts#L28)

Business domain of the prompt

***

### owner?

> `optional` **owner?**: `string`

Defined in: [core/src/types/prompts.ts:26](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/prompts.ts#L26)

Team or person accountable for the prompt

***

### reviewers?

> `optional` **reviewers?**: `string`[]

Defined in: [core/src/types/prompts.ts:32](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/prompts.ts#L32)

People or teams that review changes

***

### risk?

> `optional` **risk?**: [`RiskLevel`](https://getpromptscript.dev/api-reference/core/src/type-aliases/RiskLevel/index.md)

Defined in: [core/src/types/prompts.ts:24](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/prompts.ts#L24)

Risk classification