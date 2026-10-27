# parseApprovalRecord()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parseApprovalRecord()

> **parseApprovalRecord**(`content`): [`ApprovalRecordV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/ApprovalRecordV1/index.md) \| `undefined`

Defined in: [core/src/types/approval.ts:166](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/approval.ts#L166)

Read an approval record file. The bytes must be valid UTF-8, pass
[isApprovalRecordV1](https://getpromptscript.dev/api-reference/core/src/functions/isApprovalRecordV1/index.md) and equal the UTF-8 bytes of
[serializeApprovalRecord](https://getpromptscript.dev/api-reference/core/src/functions/serializeApprovalRecord/index.md) of the record, so a record with other key
order, escapes, line endings or a byte order mark is refused.

## Parameters

### content

`Uint8Array`

File content as read from disk

## Returns

[`ApprovalRecordV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/ApprovalRecordV1/index.md) \| `undefined`

The record, or undefined when the content is no valid record