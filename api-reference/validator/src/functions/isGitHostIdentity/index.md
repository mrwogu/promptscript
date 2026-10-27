# isGitHostIdentity()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isGitHostIdentity()

> **isGitHostIdentity**(`value`): `boolean`

Defined in: [validator/src/rules/governance-values.ts:39](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/validator/src/rules/governance-values.ts#L39)

A user (`@jane`), a team (`@acme/legal`, GitLab subgroups allowed) or an email
address of at most 254 characters, the owner forms CODEOWNERS takes.

## Parameters

### value

`string`

## Returns

`boolean`