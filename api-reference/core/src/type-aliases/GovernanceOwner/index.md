# GovernanceOwner

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: GovernanceOwner

> **GovernanceOwner** = `string` & `object`

Defined in: [core/src/types/config.ts:238](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/config.ts#L238)

Git host identity of an owner, in a form CODEOWNERS accepts: a user (`@jane`),
a team (`@acme/legal`, GitLab subgroups allowed) or an email address.

## Type Declaration

### \_\_brand?

> `readonly` `optional` **\_\_brand?**: `"GovernanceOwner"`

## Pattern

^(?:@[A-Za-z0-9][A-Za-z0-9-]{0,38}|@[A-Za-z0-9][A-Za-z0-9_.-]*(?:/[A-Za-z0-9][A-Za-z0-9_.-]*)+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})$

## Max Length

254