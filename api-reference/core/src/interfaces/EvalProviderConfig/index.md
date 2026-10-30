# EvalProviderConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalProviderConfig

Defined in: [core/src/types/config.ts:303](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/config.ts#L303)

One model provider that eval suites can call.

## Properties

### apiKeyEnvVar?

> `optional` **apiKeyEnvVar?**: `string`

Defined in: [core/src/types/config.ts:317](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/config.ts#L317)

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

Defined in: [core/src/types/config.ts:310](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/config.ts#L310)

Base URL of the provider API.

#### Example

```ts
"https://llm.corp.example/v1"
```

***

### kind

> **kind**: [`EvalProviderKind`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalProviderKind/index.md)

Defined in: [core/src/types/config.ts:305](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/config.ts#L305)

Request and response format: the Anthropic Messages API or an OpenAI-compatible chat API