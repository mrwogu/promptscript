# evaluatePromptPolicies()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: evaluatePromptPolicies()

> **evaluatePromptPolicies**(`policies`, `subjects`, `context?`, `scope?`): [`PolicyViolation`](https://getpromptscript.dev/api-reference/core/src/interfaces/PolicyViolation/index.md)[]

Defined in: [validator/src/policy/prompt-evaluator.ts:246](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/validator/src/policy/prompt-evaluator.ts#L246)

Evaluate the prompt policy kinds on prompts.

Every policy matches on policy risk: the higher of the effective risk (unset
counts as low) and the floor of every risk-floor policy, whatever its
severity. `required-approvals` and `required-evals` are not evaluated here.

## Parameters

### policies

readonly [`PolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PolicyDefinition/index.md)[]

Parsed policy definitions

### subjects

readonly [`PolicySubject`](https://getpromptscript.dev/api-reference/core/src/interfaces/PolicySubject/index.md)[]

Prompts as policies see them

### context?

[`PolicyContext`](https://getpromptscript.dev/api-reference/validator/src/type-aliases/PolicyContext/index.md) = `{}`

Model catalog settings and the blocked-pattern setup of PS005

### scope?

[`PromptPolicyScope`](https://getpromptscript.dev/api-reference/validator/src/interfaces/PromptPolicyScope/index.md)

Risk and selection to use for every subject instead of its own

## Returns

[`PolicyViolation`](https://getpromptscript.dev/api-reference/core/src/interfaces/PolicyViolation/index.md)[]

Violations, each at the location of its prompt