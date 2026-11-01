# PromptReleaseLabelV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptReleaseLabelV1

Defined in: [core/src/types/prompt-bundle.ts:200](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/prompt-bundle.ts#L200)

Label of one release environment: the bundle each prompt id has there, version 1.

## Properties

### $schema

> **$schema**: `"https://getpromptscript.dev/schema/prompt-release-label/v1.json"`

Defined in: [core/src/types/prompt-bundle.ts:205](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/prompt-bundle.ts#L205)

Schema URL, the version tag of the label.

#### Example

```ts
"https://getpromptscript.dev/schema/prompt-release-label/v1.json"
```

***

### environment

> **environment**: [`ReleaseEnvironmentName`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ReleaseEnvironmentName/index.md)

Defined in: [core/src/types/prompt-bundle.ts:210](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/prompt-bundle.ts#L210)

Environment name.

#### Example

```ts
"prod"
```

***

### prompts

> **prompts**: [`PromptReleaseLabelEntry`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptReleaseLabelEntry/index.md)[]

Defined in: [core/src/types/prompt-bundle.ts:212](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/prompt-bundle.ts#L212)

Released prompts sorted by id