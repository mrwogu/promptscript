# pathTraversal

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: pathTraversal

> `const` **pathTraversal**: [`ValidationRule`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationRule/index.md)

Defined in: [validator/src/rules/path-traversal.ts:86](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/rules/path-traversal.ts#L86)

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