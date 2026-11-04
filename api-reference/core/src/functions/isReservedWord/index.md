# isReservedWord()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isReservedWord()

> **isReservedWord**(`word`): word is "string" \| "number" \| "boolean" \| "identity" \| "context" \| "standards" \| "restrictions" \| "knowledge" \| "shortcuts" \| "commands" \| "guards" \| "params" \| "skills" \| "local" \| "agents" \| "workflows" \| "prompts" \| "examples" \| "hooks" \| "mcpServers" \| "plugins" \| "inherit" \| "use" \| "extend" \| "list" \| "enum" \| "range" \| "meta" \| "as" \| "true" \| "false" \| "null"

Defined in: [core/src/types/constants.ts:83](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/constants.ts#L83)

Check if a string is a reserved word.

## Parameters

### word

`string`

String to check

## Returns

word is "string" \| "number" \| "boolean" \| "identity" \| "context" \| "standards" \| "restrictions" \| "knowledge" \| "shortcuts" \| "commands" \| "guards" \| "params" \| "skills" \| "local" \| "agents" \| "workflows" \| "prompts" \| "examples" \| "hooks" \| "mcpServers" \| "plugins" \| "inherit" \| "use" \| "extend" \| "list" \| "enum" \| "range" \| "meta" \| "as" \| "true" \| "false" \| "null"

True if the word is reserved