# ReleaseChange

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ReleaseChange

Defined in: [cli/src/utils/release-report.ts:38](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/utils/release-report.ts#L38)

## Properties

### action

> **action**: [`ReleaseChangeAction`](https://getpromptscript.dev/api-reference/cli/src/type-aliases/ReleaseChangeAction/index.md)

Defined in: [cli/src/utils/release-report.ts:41](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/utils/release-report.ts#L41)

***

### contentHash?

> `optional` **contentHash?**: `string`

Defined in: [cli/src/utils/release-report.ts:45](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/utils/release-report.ts#L45)

Content hash the entry holds after the command

***

### experiment?

> `optional` **experiment?**: `ReleaseChangeExperiment`

Defined in: [cli/src/utils/release-report.ts:49](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/utils/release-report.ts#L49)

Set on an arm item of an experiment; the entry item has none

***

### id?

> `optional` **id?**: `string`

Defined in: [cli/src/utils/release-report.ts:43](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/utils/release-report.ts#L43)

Prompt id, for a bundle or label entry

***

### path

> **path**: `string`

Defined in: [cli/src/utils/release-report.ts:40](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/utils/release-report.ts#L40)

Project-relative path of the file

***

### previousContentHash?

> `optional` **previousContentHash?**: `string`

Defined in: [cli/src/utils/release-report.ts:47](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/cli/src/utils/release-report.ts#L47)

Content hash the entry held before the command