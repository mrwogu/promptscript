# TargetModel

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: TargetModel

Defined in: [core/src/model-catalog.ts:586](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/model-catalog.ts#L586)

A model reference mapped to one target.

## Properties

### issue?

> `readonly` `optional` **issue?**: [`TargetModelIssue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/TargetModelIssue/index.md)

Defined in: [core/src/model-catalog.ts:590](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/model-catalog.ts#L590)

Why the value was omitted or written unchanged

***

### profile?

> `readonly` `optional` **profile?**: [`ModelProfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelProfile/index.md)

Defined in: [core/src/model-catalog.ts:592](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/model-catalog.ts#L592)

Catalog profile behind the reference

***

### value?

> `readonly` `optional` **value?**: `string`

Defined in: [core/src/model-catalog.ts:588](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/model-catalog.ts#L588)

Native value to write, or undefined to omit the field