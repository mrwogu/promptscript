# approvalRecordPath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: approvalRecordPath()

> **approvalRecordPath**(`record`): `string`

Defined in: [core/src/types/approval.ts:188](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/approval.ts#L188)

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