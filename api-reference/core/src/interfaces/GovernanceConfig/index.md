# GovernanceConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: GovernanceConfig

Defined in: [core/src/types/config.ts:271](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/config.ts#L271)

Governance settings (`governance` in promptscript.yaml): who owns the setup and
which teams review each approval role.

## Properties

### admins?

> `optional` **admins?**: [`GovernanceOwner`](https://getpromptscript.dev/api-reference/core/src/type-aliases/GovernanceOwner/index.md)[]

Defined in: [core/src/types/config.ts:278](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/config.ts#L278)

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

Defined in: [core/src/types/config.ts:294](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/config.ts#L294)

Generated CODEOWNERS settings

***

### dataClasses?

> `optional` **dataClasses?**: `string`[]

Defined in: [core/src/types/config.ts:292](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/config.ts#L292)

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

Defined in: [core/src/types/config.ts:286](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/config.ts#L286)

Approval roles by name, each with the owners that review it. At most 32 roles.
Under `extends` each role's list is joined with the base list and cannot shrink.

#### Example

```ts
{ legal: ['@acme/legal'], security: ['@acme/appsec'] }
```

#### Max Properties

32

#### Property Names