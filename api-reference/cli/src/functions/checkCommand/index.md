# checkCommand()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: checkCommand()

> **checkCommand**(`_options`): `Promise`\<`void`\>

Defined in: [cli/src/commands/check.ts:91](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/cli/src/commands/check.ts#L91)

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