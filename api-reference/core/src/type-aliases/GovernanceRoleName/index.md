# GovernanceRoleName

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: GovernanceRoleName

> **GovernanceRoleName** = `string` & `object`

Defined in: [core/src/types/config.ts:303](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/config.ts#L303)

Name of an approval role: lowercase letters, digits and hyphens, starting with a
letter. Windows device names are refused, since a role names a directory.

## Type Declaration

### \_\_brand?

> `readonly` `optional` **\_\_brand?**: `"GovernanceRoleName"`

## Pattern

^(?!(?:con|prn|aux|nul|com[0-9]|lpt[0-9])$)[a-z][a-z0-9-]{0,31}$