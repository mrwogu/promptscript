# EvalConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalConfig

Defined in: [core/src/types/config.ts:403](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L403)

Eval settings (`eval` in promptscript.yaml): the providers eval suites
call and the limits of a run.

## Properties

### maxCases?

> `optional` **maxCases?**: `number`

Defined in: [core/src/types/config.ts:432](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L432)

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

Defined in: [core/src/types/config.ts:425](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L425)

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

Defined in: [core/src/types/config.ts:411](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L411)

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

Defined in: [core/src/types/config.ts:437](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L437)

Directory for eval reports, relative to the project root.

#### Example

```ts
".promptscript/eval-reports"
```

***

### timeoutMs?

> `optional` **timeoutMs?**: `number`

Defined in: [core/src/types/config.ts:418](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L418)

Time limit of one model call in milliseconds, response body included.

#### As Type

integer

#### Minimum

1

#### Default

```ts
60000
```