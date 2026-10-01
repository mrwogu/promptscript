# parsePolicies()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parsePolicies()

> **parsePolicies**(`input`): [`ParsedPolicies`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ParsedPolicies/index.md)

Defined in: [validator/src/policy/parser.ts:192](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/policy/parser.ts#L192)

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