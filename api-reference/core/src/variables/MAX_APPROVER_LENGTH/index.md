# MAX_APPROVER_LENGTH

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: MAX\_APPROVER\_LENGTH

> `const` **MAX\_APPROVER\_LENGTH**: `101` = `101`

Defined in: [core/src/types/approval.ts:89](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/approval.ts#L89)

Longest approver handle, `@` included. The handle is part of the record file name,
so it stays far below the 255 byte limit of a file name.