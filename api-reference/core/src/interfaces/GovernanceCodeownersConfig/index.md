# GovernanceCodeownersConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: GovernanceCodeownersConfig

Defined in: [core/src/types/config.ts:323](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/config.ts#L323)

Settings of the generated CODEOWNERS file.

## Properties

### output?

> `optional` **output?**: `".github/CODEOWNERS"` \| `"CODEOWNERS"` \| `"docs/CODEOWNERS"` \| `".gitlab/CODEOWNERS"`

Defined in: [core/src/types/config.ts:328](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/config.ts#L328)

Path of the CODEOWNERS file, relative to the repository root.

#### Default

```ts
".github/CODEOWNERS"
```

***

### prompts?

> `optional` **prompts?**: `boolean`

Defined in: [core/src/types/config.ts:339](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/config.ts#L339)

Write lines for the `.prs` files that define prompts.

#### Default

```ts
true
```

***

### protect?

> `optional` **protect?**: `string`[]

Defined in: [core/src/types/config.ts:334](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/config.ts#L334)

More paths owned by the admins, relative to the repository root.
Under `extends` the lists are joined and cannot shrink.

#### Example

```ts
['.github/workflows']
```