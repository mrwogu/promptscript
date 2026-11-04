# CheckContext

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CheckContext

Defined in: [eval/src/suite/common.ts:12](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/eval/src/suite/common.ts#L12)

What suites are checked against.

## Properties

### bundles

> **bundles**: readonly [`PromptBundleV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptBundleV1/index.md)[]

Defined in: [eval/src/suite/common.ts:14](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/eval/src/suite/common.ts#L14)

Prompt bundles the project compiles

***

### catalog

> **catalog**: [`ModelCatalog`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelCatalog/index.md)

Defined in: [eval/src/suite/common.ts:18](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/eval/src/suite/common.ts#L18)

Model catalog with the project's profiles

***

### rubrics?

> `optional` **rubrics?**: readonly [`PromptBundleV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptBundleV1/index.md)[]

Defined in: [eval/src/suite/common.ts:16](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/eval/src/suite/common.ts#L16)

Where judge rubrics are looked up; defaults to `bundles`