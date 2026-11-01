# GIT_HOST_USER_PATTERN

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: GIT\_HOST\_USER\_PATTERN

> `const` **GIT\_HOST\_USER\_PATTERN**: `RegExp`

Defined in: [core/src/types/approval.ts:91](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/approval.ts#L91)

A Git host user handle: `@`, a letter or digit, then letters, digits, `_`, `.` or `-`,
with no two of `_.-` in a row and none at the end. GitLab users may hold `.` and `_`,
and GitHub managed users end in `_<shortcode>`. Hosts never issue other handles, and
CODEOWNERS ignores an invalid user, so it would drop the rule's protection silently.
Governance owners and approvers share this rule. `_.-` never matches a letter or digit,
so each character has one way to match and the match stays linear. No lookahead,
because TypeDoc reads `](` in the pattern as a Markdown link.