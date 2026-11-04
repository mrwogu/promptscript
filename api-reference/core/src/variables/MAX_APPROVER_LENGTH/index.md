# MAX_APPROVER_LENGTH

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: MAX\_APPROVER\_LENGTH

> `const` **MAX\_APPROVER\_LENGTH**: `101` = `101`

Defined in: [core/src/types/approval.ts:97](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/approval.ts#L97)

Longest approver handle, `@` included. The handle is part of the record file name,
so it stays far below the 255 byte limit of a file name.