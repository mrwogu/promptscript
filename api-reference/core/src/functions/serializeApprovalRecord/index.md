# serializeApprovalRecord()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: serializeApprovalRecord()

> **serializeApprovalRecord**(`record`): `string`

Defined in: [core/src/types/approval.ts:164](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/approval.ts#L164)

The exact bytes of an approval record file: fixed key order, two-space indent,
one trailing newline.

## Parameters

### record

[`ApprovalRecordV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/ApprovalRecordV1/index.md)

## Returns

`string`