# isApprovalRecordV1()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isApprovalRecordV1()

> **isApprovalRecordV1**(`value`): `value is ApprovalRecordV1`

Defined in: [core/src/types/approval.ts:119](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/approval.ts#L119)

Type guard for an approval record: exact keys, every field pattern of the schema.
Use [parseApprovalRecord](https://getpromptscript.dev/api-reference/core/src/functions/parseApprovalRecord/index.md) on file content, it also checks the exact bytes.

## Parameters

### value

`unknown`

## Returns

`value is ApprovalRecordV1`