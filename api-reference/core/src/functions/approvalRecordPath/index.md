# approvalRecordPath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: approvalRecordPath()

> **approvalRecordPath**(`record`): `string`

Defined in: [core/src/types/approval.ts:188](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/approval.ts#L188)

Path of an approval record relative to the project root, with `/` separators:
`.promptscript/approvals/<role>/<prompt id>/<contentHash>.<approver slug>.json`.
The slug is the approver handle without its `@`, lowercased, so one approver
has one file per role and hash on every file system.

## Parameters

### record

[`ApprovalRecordV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/ApprovalRecordV1/index.md)

## Returns

`string`

## Throws

PSError when the record fails [isApprovalRecordV1](https://getpromptscript.dev/api-reference/core/src/functions/isApprovalRecordV1/index.md), since its
fields would not make a safe path.