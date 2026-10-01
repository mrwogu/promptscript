# GitAuthOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: GitAuthOptions

Defined in: [resolver/src/git-registry.ts:81](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L81)

Authentication options for Git registry.

## Properties

### sshKeyPath?

> `optional` **sshKeyPath?**: `string`

Defined in: [resolver/src/git-registry.ts:89](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L89)

Path to SSH key (for SSH auth, defaults to ~/.ssh/id_rsa)

***

### token?

> `optional` **token?**: `string`

Defined in: [resolver/src/git-registry.ts:85](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L85)

Personal access token (for token auth)

***

### tokenEnvVar?

> `optional` **tokenEnvVar?**: `string`

Defined in: [resolver/src/git-registry.ts:87](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L87)

Environment variable containing the token

***

### type

> **type**: `"token"` \| `"ssh"`

Defined in: [resolver/src/git-registry.ts:83](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/git-registry.ts#L83)

Authentication type