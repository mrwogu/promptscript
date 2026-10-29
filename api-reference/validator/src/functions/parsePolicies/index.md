# parsePolicies()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parsePolicies()

> **parsePolicies**(`input`, `context?`): [`ParsedPolicies`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ParsedPolicies/index.md)

Defined in: [validator/src/policy/parser.ts:590](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/validator/src/policy/parser.ts#L590)

Parse and validate policy definitions from config.

Validates all policies and collects errors without stopping at the first
failure. Successfully validated policies are returned alongside any errors.
An unknown kind is an error, so a policy this version cannot evaluate never
passes silently. Prompt kinds also reject unknown keys, and check roles,
environments, models and, when `governance.dataClasses` is set, data classes
against `context`.

## Parameters

### input

`unknown`

Raw `policies` value from config: a list, or undefined or null for none

### context?

[`PolicyContext`](https://getpromptscript.dev/api-reference/validator/src/type-aliases/PolicyContext/index.md) = `{}`

Governance, release and model settings of the project

## Returns

[`ParsedPolicies`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ParsedPolicies/index.md)

Parsed policies and any validation errors