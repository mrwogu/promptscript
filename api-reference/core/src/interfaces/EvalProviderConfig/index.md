# EvalProviderConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalProviderConfig

Defined in: [core/src/types/config.ts:301](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/config.ts#L301)

One model provider that eval suites can call.

## Properties

### apiKeyEnvVar?

> `optional` **apiKeyEnvVar?**: `string`

Defined in: [core/src/types/config.ts:315](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/config.ts#L315)

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

Defined in: [core/src/types/config.ts:308](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/config.ts#L308)

Base URL of the provider API.

#### Example

```ts
"https://llm.corp.example/v1"
```

***

### kind

> **kind**: [`EvalProviderKind`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalProviderKind/index.md)

Defined in: [core/src/types/config.ts:303](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/config.ts#L303)

Request and response format: the Anthropic Messages API or an OpenAI-compatible chat API