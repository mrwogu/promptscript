# serializeApprovalRecord()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: serializeApprovalRecord()

> **serializeApprovalRecord**(`record`): `string`

Defined in: [core/src/types/approval.ts:191](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/approval.ts#L191)

The exact bytes of an approval record file: fixed key order, two-space indent,
one trailing newline.

## Parameters

### record

[`ApprovalRecordV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/ApprovalRecordV1/index.md)

## Returns

`string`