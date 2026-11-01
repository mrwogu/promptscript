# serializeApprovalRecord()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: serializeApprovalRecord()

> **serializeApprovalRecord**(`record`): `string`

Defined in: [core/src/types/approval.ts:180](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/approval.ts#L180)

The exact bytes of an approval record file: fixed key order, two-space indent,
one trailing newline.

## Parameters

### record

[`ApprovalRecordV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/ApprovalRecordV1/index.md)

## Returns

`string`