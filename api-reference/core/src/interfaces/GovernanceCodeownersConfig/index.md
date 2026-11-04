# GovernanceCodeownersConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: GovernanceCodeownersConfig

Defined in: [core/src/types/config.ts:329](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/config.ts#L329)

Settings of the generated CODEOWNERS file.

## Properties

### output?

> `optional` **output?**: `".github/CODEOWNERS"` \| `"CODEOWNERS"` \| `"docs/CODEOWNERS"` \| `".gitlab/CODEOWNERS"`

Defined in: [core/src/types/config.ts:334](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/config.ts#L334)

Path of the CODEOWNERS file, relative to the repository root.

#### Default

```ts
".github/CODEOWNERS"
```

***

### prompts?

> `optional` **prompts?**: `boolean`

Defined in: [core/src/types/config.ts:345](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/config.ts#L345)

Write lines for the `.prs` files that define prompts.

#### Default

```ts
true
```

***

### protect?

> `optional` **protect?**: `string`[]

Defined in: [core/src/types/config.ts:340](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/config.ts#L340)

More paths owned by the admins, relative to the repository root.
Under `extends` the lists are joined and cannot shrink.

#### Example

```ts
['.github/workflows']
```