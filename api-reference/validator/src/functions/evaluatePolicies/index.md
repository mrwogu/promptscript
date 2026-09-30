# evaluatePolicies()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: evaluatePolicies()

> **evaluatePolicies**(`policies`, `ast`): [`PolicyViolation`](https://getpromptscript.dev/api-reference/core/src/interfaces/PolicyViolation/index.md)[]

Defined in: [validator/src/policy/evaluator.ts:219](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/policy/evaluator.ts#L219)

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