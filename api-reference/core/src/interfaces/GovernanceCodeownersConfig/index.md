# GovernanceCodeownersConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: GovernanceCodeownersConfig

Defined in: [core/src/types/config.ts:250](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/config.ts#L250)

Settings of the generated CODEOWNERS file.

## Properties

### output?

> `optional` **output?**: `".github/CODEOWNERS"` \| `"CODEOWNERS"` \| `"docs/CODEOWNERS"` \| `".gitlab/CODEOWNERS"`

Defined in: [core/src/types/config.ts:255](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/config.ts#L255)

Path of the CODEOWNERS file, relative to the repository root.

#### Default

```ts
".github/CODEOWNERS"
```

***

### prompts?

> `optional` **prompts?**: `boolean`

Defined in: [core/src/types/config.ts:266](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/config.ts#L266)

Write lines for the `.prs` files that define prompts.

#### Default

```ts
true
```

***

### protect?

> `optional` **protect?**: `string`[]

Defined in: [core/src/types/config.ts:261](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/config.ts#L261)

More paths owned by the admins, relative to the repository root.
Under `extends` the lists are joined and cannot shrink.

#### Example

```ts
['.github/workflows']
```