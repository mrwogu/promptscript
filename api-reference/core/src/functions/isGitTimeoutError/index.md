# isGitTimeoutError()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isGitTimeoutError()

> **isGitTimeoutError**(`error`): `boolean`

Defined in: [core/src/git-timeout.ts:10](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/git-timeout.ts#L10)

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