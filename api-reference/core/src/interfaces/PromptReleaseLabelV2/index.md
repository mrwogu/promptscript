# PromptReleaseLabelV2

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptReleaseLabelV2

Defined in: [core/src/types/prompt-bundle.ts:283](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/prompt-bundle.ts#L283)

Label of one release environment with optional weighted variants, version 2.

## Properties

### $schema

> **$schema**: `"https://getpromptscript.dev/schema/prompt-release-label/v2.json"`

Defined in: [core/src/types/prompt-bundle.ts:288](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/prompt-bundle.ts#L288)

Schema URL, the version tag of the label.

#### Example

```ts
"https://getpromptscript.dev/schema/prompt-release-label/v2.json"
```

***

### environment

> **environment**: [`ReleaseEnvironmentName`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ReleaseEnvironmentName/index.md)

Defined in: [core/src/types/prompt-bundle.ts:293](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/prompt-bundle.ts#L293)

Environment name.

#### Example

```ts
"prod"
```

***

### prompts

> **prompts**: [`PromptReleaseLabelEntryV2`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptReleaseLabelEntryV2/index.md)[]

Defined in: [core/src/types/prompt-bundle.ts:295](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/prompt-bundle.ts#L295)

Released prompts sorted by id