# TargetModel

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: TargetModel

Defined in: [core/src/model-catalog.ts:564](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/model-catalog.ts#L564)

A model reference mapped to one target.

## Properties

### issue?

> `readonly` `optional` **issue?**: [`TargetModelIssue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/TargetModelIssue/index.md)

Defined in: [core/src/model-catalog.ts:568](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/model-catalog.ts#L568)

Why the value was omitted or written unchanged

***

### profile?

> `readonly` `optional` **profile?**: [`ModelProfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelProfile/index.md)

Defined in: [core/src/model-catalog.ts:570](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/model-catalog.ts#L570)

Catalog profile behind the reference

***

### value?

> `readonly` `optional` **value?**: `string`

Defined in: [core/src/model-catalog.ts:566](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/model-catalog.ts#L566)

Native value to write, or undefined to omit the field