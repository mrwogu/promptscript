# PromptReleaseLabelV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptReleaseLabelV1

Defined in: [core/src/types/prompt-bundle.ts:200](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/prompt-bundle.ts#L200)

Label of one release environment: the bundle each prompt id has there, version 1.

## Properties

### $schema

> **$schema**: `"https://getpromptscript.dev/schema/prompt-release-label/v1.json"`

Defined in: [core/src/types/prompt-bundle.ts:205](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/prompt-bundle.ts#L205)

Schema URL, the version tag of the label.

#### Example

```ts
"https://getpromptscript.dev/schema/prompt-release-label/v1.json"
```

***

### environment

> **environment**: [`ReleaseEnvironmentName`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ReleaseEnvironmentName/index.md)

Defined in: [core/src/types/prompt-bundle.ts:210](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/prompt-bundle.ts#L210)

Environment name.

#### Example

```ts
"prod"
```

***

### prompts

> **prompts**: [`PromptReleaseLabelEntry`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptReleaseLabelEntry/index.md)[]

Defined in: [core/src/types/prompt-bundle.ts:212](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/prompt-bundle.ts#L212)

Released prompts sorted by id