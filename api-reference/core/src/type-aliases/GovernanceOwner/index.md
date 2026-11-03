# GovernanceOwner

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: GovernanceOwner

> **GovernanceOwner** = `string` & `object`

Defined in: [core/src/types/config.ts:313](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/config.ts#L313)

Git host identity of an owner, in a form CODEOWNERS accepts: a user (`@jane`),
a team (`@acme/legal`, GitLab subgroups allowed) or an email address. A user may
hold `.`, `_` and `-` between letters or digits, like GitLab users (`@jane.doe`) and
GitHub managed users (`@jane_acme`).

## Type Declaration

### \_\_brand?

> `readonly` `optional` **\_\_brand?**: `"GovernanceOwner"`

## Pattern

^(?:@[A-Za-z0-9]+(?:[_.-][A-Za-z0-9]+)*|@[A-Za-z0-9][A-Za-z0-9_.-]*(?:/[A-Za-z0-9][A-Za-z0-9_.-]*)+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})$

## Max Length

254