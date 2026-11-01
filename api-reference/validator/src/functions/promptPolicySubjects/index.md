# promptPolicySubjects()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: promptPolicySubjects()

> **promptPolicySubjects**(`program`): [`PolicySubject`](https://getpromptscript.dev/api-reference/core/src/interfaces/PolicySubject/index.md)[]

Defined in: [validator/src/policy/prompt-evaluator.ts:288](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/validator/src/policy/prompt-evaluator.ts#L288)

The `@prompts` entries of a resolved program as policy subjects: effective
governance with the `@meta` defaults, and the entry's own `system` and `user`
texts. Composed blocks are left out, the content rules already scan them.

## Parameters

### program

[`ProgramInput`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ProgramInput/index.md)

A resolved program, canonical or legacy

## Returns

[`PolicySubject`](https://getpromptscript.dev/api-reference/core/src/interfaces/PolicySubject/index.md)[]

One subject per valid entry, located at the entry