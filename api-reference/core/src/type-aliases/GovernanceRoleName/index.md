# GovernanceRoleName

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: GovernanceRoleName

> **GovernanceRoleName** = `string` & `object`

Defined in: [core/src/types/config.ts:309](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/config.ts#L309)

Name of an approval role: lowercase letters, digits and hyphens, starting with a
letter. Windows device names are refused, since a role names a directory.

## Type Declaration

### \_\_brand?

> `readonly` `optional` **\_\_brand?**: `"GovernanceRoleName"`

## Pattern

^(?!(?:con|prn|aux|nul|com[0-9]|lpt[0-9])$)[a-z][a-z0-9-]{0,31}$