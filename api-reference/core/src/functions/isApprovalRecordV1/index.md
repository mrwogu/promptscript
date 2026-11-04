# isApprovalRecordV1()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isApprovalRecordV1()

> **isApprovalRecordV1**(`value`): `value is ApprovalRecordV1`

Defined in: [core/src/types/approval.ts:166](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/approval.ts#L166)

Type guard for an approval record: exact keys, every field pattern and the `maxWeight` range of the schema.
Use [parseApprovalRecord](https://getpromptscript.dev/api-reference/core/src/functions/parseApprovalRecord/index.md) on file content, it also checks the exact bytes.

## Parameters

### value

`unknown`

## Returns

`value is ApprovalRecordV1`