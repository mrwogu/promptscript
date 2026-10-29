# GovernanceCodeownersConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: GovernanceCodeownersConfig

Defined in: [core/src/types/config.ts:248](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/config.ts#L248)

Settings of the generated CODEOWNERS file.

## Properties

### output?

> `optional` **output?**: `".github/CODEOWNERS"` \| `"CODEOWNERS"` \| `"docs/CODEOWNERS"` \| `".gitlab/CODEOWNERS"`

Defined in: [core/src/types/config.ts:253](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/config.ts#L253)

Path of the CODEOWNERS file, relative to the repository root.

#### Default

```ts
".github/CODEOWNERS"
```

***

### prompts?

> `optional` **prompts?**: `boolean`

Defined in: [core/src/types/config.ts:264](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/config.ts#L264)

Write lines for the `.prs` files that define prompts.

#### Default

```ts
true
```

***

### protect?

> `optional` **protect?**: `string`[]

Defined in: [core/src/types/config.ts:259](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/config.ts#L259)

More paths owned by the admins, relative to the repository root.
Under `extends` the lists are joined and cannot shrink.

#### Example

```ts
['.github/workflows']
```