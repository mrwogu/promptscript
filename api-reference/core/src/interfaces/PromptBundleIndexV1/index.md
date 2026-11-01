# PromptBundleIndexV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptBundleIndexV1

Defined in: [core/src/types/prompt-bundle.ts:170](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/prompt-bundle.ts#L170)

Index of the prompt bundles of one compilation, version 1.

## Properties

### $schema

> **$schema**: `"https://getpromptscript.dev/schema/prompt-bundle-index/v1.json"`

Defined in: [core/src/types/prompt-bundle.ts:175](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/prompt-bundle.ts#L175)

Schema URL, the version tag of the index.

#### Example

```ts
"https://getpromptscript.dev/schema/prompt-bundle-index/v1.json"
```

***

### prompts

> **prompts**: [`PromptBundleIndexEntry`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptBundleIndexEntry/index.md)[]

Defined in: [core/src/types/prompt-bundle.ts:182](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/prompt-bundle.ts#L182)

Prompts sorted by id

***

### source

> **source**: `string`

Defined in: [core/src/types/prompt-bundle.ts:180](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/prompt-bundle.ts#L180)

Entry file of the compilation.

#### Example

```ts
".promptscript/project.prs"
```