# TargetModel

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: TargetModel

Defined in: [core/src/model-catalog.ts:591](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/model-catalog.ts#L591)

A model reference mapped to one target.

## Properties

### issue?

> `readonly` `optional` **issue?**: [`TargetModelIssue`](https://getpromptscript.dev/api-reference/core/src/type-aliases/TargetModelIssue/index.md)

Defined in: [core/src/model-catalog.ts:595](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/model-catalog.ts#L595)

Why the value was omitted or written unchanged

***

### profile?

> `readonly` `optional` **profile?**: [`ModelProfile`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelProfile/index.md)

Defined in: [core/src/model-catalog.ts:597](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/model-catalog.ts#L597)

Catalog profile behind the reference

***

### value?

> `readonly` `optional` **value?**: `string`

Defined in: [core/src/model-catalog.ts:593](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/model-catalog.ts#L593)

Native value to write, or undefined to omit the field