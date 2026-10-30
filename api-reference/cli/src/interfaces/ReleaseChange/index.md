# ReleaseChange

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ReleaseChange

Defined in: [cli/src/utils/release-report.ts:29](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/cli/src/utils/release-report.ts#L29)

## Properties

### action

> **action**: [`ReleaseChangeAction`](https://getpromptscript.dev/api-reference/cli/src/type-aliases/ReleaseChangeAction/index.md)

Defined in: [cli/src/utils/release-report.ts:32](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/cli/src/utils/release-report.ts#L32)

***

### contentHash?

> `optional` **contentHash?**: `string`

Defined in: [cli/src/utils/release-report.ts:36](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/cli/src/utils/release-report.ts#L36)

Content hash the entry holds after the command

***

### experiment?

> `optional` **experiment?**: `ReleaseChangeExperiment`

Defined in: [cli/src/utils/release-report.ts:40](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/cli/src/utils/release-report.ts#L40)

Set on an arm item of an experiment; the entry item has none

***

### id?

> `optional` **id?**: `string`

Defined in: [cli/src/utils/release-report.ts:34](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/cli/src/utils/release-report.ts#L34)

Prompt id, for a bundle or label entry

***

### path

> **path**: `string`

Defined in: [cli/src/utils/release-report.ts:31](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/cli/src/utils/release-report.ts#L31)

Project-relative path of the file

***

### previousContentHash?

> `optional` **previousContentHash?**: `string`

Defined in: [cli/src/utils/release-report.ts:38](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/cli/src/utils/release-report.ts#L38)

Content hash the entry held before the command