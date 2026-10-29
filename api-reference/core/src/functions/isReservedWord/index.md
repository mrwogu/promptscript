# isReservedWord()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isReservedWord()

> **isReservedWord**(`word`): word is "string" \| "number" \| "boolean" \| "identity" \| "context" \| "standards" \| "restrictions" \| "knowledge" \| "shortcuts" \| "commands" \| "guards" \| "params" \| "skills" \| "local" \| "agents" \| "workflows" \| "prompts" \| "examples" \| "hooks" \| "mcpServers" \| "plugins" \| "inherit" \| "use" \| "extend" \| "list" \| "enum" \| "range" \| "meta" \| "as" \| "true" \| "false" \| "null"

Defined in: [core/src/types/constants.ts:83](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/constants.ts#L83)

Check if a string is a reserved word.

## Parameters

### word

`string`

String to check

## Returns

word is "string" \| "number" \| "boolean" \| "identity" \| "context" \| "standards" \| "restrictions" \| "knowledge" \| "shortcuts" \| "commands" \| "guards" \| "params" \| "skills" \| "local" \| "agents" \| "workflows" \| "prompts" \| "examples" \| "hooks" \| "mcpServers" \| "plugins" \| "inherit" \| "use" \| "extend" \| "list" \| "enum" \| "range" \| "meta" \| "as" \| "true" \| "false" \| "null"

True if the word is reserved