# GovernanceConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: GovernanceConfig

Defined in: [core/src/types/config.ts:346](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/config.ts#L346)

Governance settings (`governance` in promptscript.yaml): who owns the setup and
which teams review each approval role.

## Properties

### admins?

> `optional` **admins?**: [`GovernanceOwner`](https://getpromptscript.dev/api-reference/core/src/type-aliases/GovernanceOwner/index.md)[]

Defined in: [core/src/types/config.ts:353](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/config.ts#L353)

Owners of the config, the approvals root and the releases.
Under `extends` the lists are joined and cannot shrink.

#### Example

```ts
['@acme/prompt-platform']
```

#### Unique Items

true

***

### codeowners?

> `optional` **codeowners?**: [`GovernanceCodeownersConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/GovernanceCodeownersConfig/index.md)

Defined in: [core/src/types/config.ts:369](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/config.ts#L369)

Generated CODEOWNERS settings

***

### dataClasses?

> `optional` **dataClasses?**: `string`[]

Defined in: [core/src/types/config.ts:367](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/config.ts#L367)

Data class names the project uses.

#### Example

```ts
['pii', 'phi', 'financial', 'credentials', 'internal', 'public']
```

#### Unique Items

true

***

### roles?

> `optional` **roles?**: `Record`\<`string`, [`GovernanceRoleOwners`](https://getpromptscript.dev/api-reference/core/src/type-aliases/GovernanceRoleOwners/index.md)\>

Defined in: [core/src/types/config.ts:361](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/config.ts#L361)

Approval roles by name, each with the owners that review it. At most 32 roles.
Under `extends` each role's list is joined with the base list and cannot shrink.

#### Example

```ts
{ legal: ['@acme/legal'], security: ['@acme/appsec'] }
```

#### Max Properties

32

#### Property Names