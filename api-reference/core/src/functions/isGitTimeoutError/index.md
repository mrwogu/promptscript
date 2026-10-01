# isGitTimeoutError()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isGitTimeoutError()

> **isGitTimeoutError**(`error`): `boolean`

Defined in: [core/src/git-timeout.ts:10](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/git-timeout.ts#L10)

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