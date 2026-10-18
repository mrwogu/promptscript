# checkCommand()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: checkCommand()

> **checkCommand**(`_options`): `Promise`\<`void`\>

Defined in: [cli/src/commands/check.ts:90](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/cli/src/commands/check.ts#L90)

Check configuration and dependencies health.
Verifies:
- Config file exists and is valid
- Effective entry files exist
- Registry and lockfile are usable
- PromptScript syntax, imports, and inheritance resolve

## Parameters

### \_options

[`CheckOptions`](https://getpromptscript.dev/api-reference/cli/src/interfaces/CheckOptions/index.md)

## Returns

`Promise`\<`void`\>