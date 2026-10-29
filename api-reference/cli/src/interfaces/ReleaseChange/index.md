# ReleaseChange

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ReleaseChange

Defined in: [cli/src/utils/release-report.ts:17](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/utils/release-report.ts#L17)

## Properties

### action

> **action**: [`ReleaseChangeAction`](https://getpromptscript.dev/api-reference/cli/src/type-aliases/ReleaseChangeAction/index.md)

Defined in: [cli/src/utils/release-report.ts:20](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/utils/release-report.ts#L20)

***

### contentHash?

> `optional` **contentHash?**: `string`

Defined in: [cli/src/utils/release-report.ts:24](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/utils/release-report.ts#L24)

Content hash the entry holds after the command

***

### id?

> `optional` **id?**: `string`

Defined in: [cli/src/utils/release-report.ts:22](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/utils/release-report.ts#L22)

Prompt id, for a bundle or label entry

***

### path

> **path**: `string`

Defined in: [cli/src/utils/release-report.ts:19](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/utils/release-report.ts#L19)

Project-relative path of the file

***

### previousContentHash?

> `optional` **previousContentHash?**: `string`

Defined in: [cli/src/utils/release-report.ts:26](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/utils/release-report.ts#L26)

Content hash the entry held before the command