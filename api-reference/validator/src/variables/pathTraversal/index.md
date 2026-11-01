# pathTraversal

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: pathTraversal

> `const` **pathTraversal**: [`ValidationRule`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationRule/index.md)

Defined in: [validator/src/rules/path-traversal.ts:88](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/validator/src/rules/path-traversal.ts#L88)

PS013: Detect path traversal attacks in path references.

This rule identifies paths that could escape the intended directory
through ".." sequences. While ./path and ../path are valid for referencing
files in the current or parent directory, patterns like ./foo/../../etc/passwd
could be used to access files outside the intended scope.

Valid paths:
- ./valid/path - stays within current directory
- ../parent/file - one level up is acceptable

Dangerous paths:
- ./foo/../../etc/passwd - escapes through traversal
- ../../../etc/passwd - multiple levels up
- ./foo/../bar - embedded traversal