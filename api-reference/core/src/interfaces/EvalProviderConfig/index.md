# EvalProviderConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalProviderConfig

Defined in: [core/src/types/config.ts:382](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/config.ts#L382)

One model provider that eval suites can call.

## Properties

### apiKeyEnvVar?

> `optional` **apiKeyEnvVar?**: `string`

Defined in: [core/src/types/config.ts:396](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/config.ts#L396)

Environment variable that holds the provider API key. The key itself
is never read from the config.

#### Pattern

^[A-Z_][A-Z0-9_]*$

#### Example

```ts
"ANTHROPIC_API_KEY"
```

***

### baseUrl?

> `optional` **baseUrl?**: `string`

Defined in: [core/src/types/config.ts:389](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/config.ts#L389)

Base URL of the provider API.

#### Example

```ts
"https://llm.corp.example/v1"
```

***

### kind

> **kind**: [`EvalProviderKind`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalProviderKind/index.md)

Defined in: [core/src/types/config.ts:384](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/config.ts#L384)

Request and response format: the Anthropic Messages API or an OpenAI-compatible chat API