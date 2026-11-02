# GovernanceRoleName

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: GovernanceRoleName

> **GovernanceRoleName** = `string` & `object`

Defined in: [core/src/types/config.ts:230](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/types/config.ts#L230)

Name of an approval role: lowercase letters, digits and hyphens, starting with a
letter. Windows device names are refused, since a role names a directory.

## Type Declaration

### \_\_brand?

> `readonly` `optional` **\_\_brand?**: `"GovernanceRoleName"`

## Pattern

^(?!(?:con|prn|aux|nul|com[0-9]|lpt[0-9])$)[a-z][a-z0-9-]{0,31}$