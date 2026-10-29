# EvalConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalConfig

Defined in: [core/src/types/config.ts:322](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/config.ts#L322)

Eval settings (`eval` in promptscript.yaml): the providers eval suites
call and the limits of a run.

## Properties

### maxCases?

> `optional` **maxCases?**: `number`

Defined in: [core/src/types/config.ts:351](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/config.ts#L351)

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

Defined in: [core/src/types/config.ts:344](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/config.ts#L344)

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

Defined in: [core/src/types/config.ts:330](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/config.ts#L330)

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

Defined in: [core/src/types/config.ts:356](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/config.ts#L356)

Directory for eval reports, relative to the project root.

#### Example

```ts
".promptscript/eval-reports"
```

***

### timeoutMs?

> `optional` **timeoutMs?**: `number`

Defined in: [core/src/types/config.ts:337](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/config.ts#L337)

Time limit of one model call in milliseconds, response body included.

#### As Type

integer

#### Minimum

1

#### Default

```ts
60000
```