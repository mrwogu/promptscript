# approvalRecordPath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: approvalRecordPath()

> **approvalRecordPath**(`record`): `string`

Defined in: [core/src/types/approval.ts:212](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/approval.ts#L212)

Path of an approval record relative to the project root, with `/` separators:
`.promptscript/approvals/<role>/<prompt id>/<contentHash>.<approver slug>.json`.
The slug is the approver handle without its `@`, lowercased, so one approver
has one file per role and hash on every file system. It holds no `/` and always
follows `<contentHash>.`, so a `.` in a handle never makes a `.` or `..` segment.

## Parameters

### record

[`ApprovalRecordV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/ApprovalRecordV1/index.md)

## Returns

`string`

## Throws

PSError when the record fails [isApprovalRecordV1](https://getpromptscript.dev/api-reference/core/src/functions/isApprovalRecordV1/index.md), since its
fields would not make a safe path.