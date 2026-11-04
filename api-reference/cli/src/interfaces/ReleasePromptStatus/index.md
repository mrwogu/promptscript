# ReleasePromptStatus

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ReleasePromptStatus

Defined in: [cli/src/utils/release-report.ts:70](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/utils/release-report.ts#L70)

## Properties

### contentHash

> **contentHash**: `string`

Defined in: [cli/src/utils/release-report.ts:72](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/utils/release-report.ts#L72)

***

### exists

> **exists**: `boolean`

Defined in: [cli/src/utils/release-report.ts:75](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/utils/release-report.ts#L75)

***

### experiment?

> `optional` **experiment?**: `ReleaseExperimentStatus`

Defined in: [cli/src/utils/release-report.ts:80](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/utils/release-report.ts#L80)

Present while the entry runs an experiment

***

### file

> **file**: `string`

Defined in: [cli/src/utils/release-report.ts:74](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/utils/release-report.ts#L74)

Project-relative path of the bundle file

***

### id

> **id**: `string`

Defined in: [cli/src/utils/release-report.ts:71](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/utils/release-report.ts#L71)

***

### inBuild

> **inBuild**: `boolean`

Defined in: [cli/src/utils/release-report.ts:78](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/utils/release-report.ts#L78)

Whether the manifest of the latest build holds this hash for the id

***

### verified

> **verified**: `boolean`

Defined in: [cli/src/utils/release-report.ts:76](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/utils/release-report.ts#L76)