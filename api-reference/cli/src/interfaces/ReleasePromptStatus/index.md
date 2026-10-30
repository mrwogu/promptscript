# ReleasePromptStatus

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ReleasePromptStatus

Defined in: [cli/src/utils/release-report.ts:61](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/cli/src/utils/release-report.ts#L61)

## Properties

### contentHash

> **contentHash**: `string`

Defined in: [cli/src/utils/release-report.ts:63](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/cli/src/utils/release-report.ts#L63)

***

### exists

> **exists**: `boolean`

Defined in: [cli/src/utils/release-report.ts:66](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/cli/src/utils/release-report.ts#L66)

***

### experiment?

> `optional` **experiment?**: `ReleaseExperimentStatus`

Defined in: [cli/src/utils/release-report.ts:71](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/cli/src/utils/release-report.ts#L71)

Present while the entry runs an experiment

***

### file

> **file**: `string`

Defined in: [cli/src/utils/release-report.ts:65](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/cli/src/utils/release-report.ts#L65)

Project-relative path of the bundle file

***

### id

> **id**: `string`

Defined in: [cli/src/utils/release-report.ts:62](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/cli/src/utils/release-report.ts#L62)

***

### inBuild

> **inBuild**: `boolean`

Defined in: [cli/src/utils/release-report.ts:69](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/cli/src/utils/release-report.ts#L69)

Whether the manifest of the latest build holds this hash for the id

***

### verified

> **verified**: `boolean`

Defined in: [cli/src/utils/release-report.ts:67](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/cli/src/utils/release-report.ts#L67)