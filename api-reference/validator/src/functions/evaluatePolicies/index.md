# evaluatePolicies()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: evaluatePolicies()

> **evaluatePolicies**(`policies`, `ast`): [`PolicyViolation`](https://getpromptscript.dev/api-reference/core/src/interfaces/PolicyViolation/index.md)[]

Defined in: [validator/src/policy/evaluator.ts:219](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/validator/src/policy/evaluator.ts#L219)

Evaluate a list of policy definitions against a resolved AST.

Finds the `@skills` block, iterates each skill, and runs every policy
against the relevant metadata. Returns all violations collected across
all skills and all policies.

## Parameters

### policies

[`PolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PolicyDefinition/index.md)[]

Parsed policy definitions

### ast

[`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md)

Resolved program AST

## Returns

[`PolicyViolation`](https://getpromptscript.dev/api-reference/core/src/interfaces/PolicyViolation/index.md)[]

Array of policy violations (empty when compliant)