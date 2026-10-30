# isGitHostIdentity()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isGitHostIdentity()

> **isGitHostIdentity**(`value`): `boolean`

Defined in: [validator/src/rules/governance-values.ts:38](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/validator/src/rules/governance-values.ts#L38)

A user (`@jane`), a team (`@acme/legal`, GitLab subgroups allowed) or an email
address of at most 254 characters, the owner forms CODEOWNERS takes.

## Parameters

### value

`string`

## Returns

`boolean`