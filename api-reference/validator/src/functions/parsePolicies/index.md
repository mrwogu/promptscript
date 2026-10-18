# parsePolicies()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parsePolicies()

> **parsePolicies**(`input`): [`ParsedPolicies`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ParsedPolicies/index.md)

Defined in: [validator/src/policy/parser.ts:192](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/validator/src/policy/parser.ts#L192)

Parse and validate policy definitions from config.

Validates all policies and collects errors without stopping at the first
failure. Successfully validated policies are returned alongside any errors.

## Parameters

### input

[`PolicyDefinition`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PolicyDefinition/index.md)[] \| `undefined`

Raw policy definitions from config, or undefined

## Returns

[`ParsedPolicies`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ParsedPolicies/index.md)

Parsed policies and any validation errors