# EvalConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalConfig

Defined in: [core/src/types/config.ts:324](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/config.ts#L324)

Eval settings (`eval` in promptscript.yaml): the providers eval suites
call and the limits of a run.

## Properties

### maxCases?

> `optional` **maxCases?**: `number`

Defined in: [core/src/types/config.ts:353](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/config.ts#L353)

Largest number of dataset rows a suite runs.

#### As Type

integer

#### Minimum

1

#### Default

```ts
1000
```

***

### maxOutputTokens?

> `optional` **maxOutputTokens?**: `number`

Defined in: [core/src/types/config.ts:346](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/config.ts#L346)

Output token cap of a model call when the prompt sets no `maxTokens`.

#### As Type

integer

#### Minimum

1

#### Default

```ts
1024
```

***

### providers?

> `optional` **providers?**: `Record`\<`string`, [`EvalProviderConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalProviderConfig/index.md)\>

Defined in: [core/src/types/config.ts:332](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/config.ts#L332)

Providers by name. The name matches the `provider` of the resolved
model profile, such as `anthropic` or `openai`.

#### Example

```ts
providers:
  anthropic: { kind: anthropic, apiKeyEnvVar: ANTHROPIC_API_KEY }
```

***

### reportDir?

> `optional` **reportDir?**: `string`

Defined in: [core/src/types/config.ts:358](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/config.ts#L358)

Directory for eval reports, relative to the project root.

#### Example

```ts
".promptscript/eval-reports"
```

***

### timeoutMs?

> `optional` **timeoutMs?**: `number`

Defined in: [core/src/types/config.ts:339](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/config.ts#L339)

Time limit of one model call in milliseconds, response body included.

#### As Type

integer

#### Minimum

1

#### Default

```ts
60000
```