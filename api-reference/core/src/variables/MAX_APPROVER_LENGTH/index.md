# MAX_APPROVER_LENGTH

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: MAX\_APPROVER\_LENGTH

> `const` **MAX\_APPROVER\_LENGTH**: `101` = `101`

Defined in: [core/src/types/approval.ts:97](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/approval.ts#L97)

Longest approver handle, `@` included. The handle is part of the record file name,
so it stays far below the 255 byte limit of a file name.