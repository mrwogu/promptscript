# isGitTimeoutError()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isGitTimeoutError()

> **isGitTimeoutError**(`error`): `boolean`

Defined in: [core/src/git-timeout.ts:10](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/git-timeout.ts#L10)

Classify an error as a Git operation timeout.

simple-git surfaces its block timeout as a plain message rather than a typed
error, so the message is inspected as well as `code`. URLs, ref names, and
branch names are stripped first: a repository or ref literally called
"timeout" must not be mistaken for a timed-out operation, because callers use
this classification to stop retrying with other credentials.

## Parameters

### error

`Error`

## Returns

`boolean`