# approvalRecordPath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: approvalRecordPath()

> **approvalRecordPath**(`record`): `string`

Defined in: [core/src/types/approval.ts:229](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/approval.ts#L229)

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