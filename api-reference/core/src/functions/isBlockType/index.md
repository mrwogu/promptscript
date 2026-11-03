# isBlockType()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isBlockType()

> **isBlockType**(`name`): name is "identity" \| "context" \| "standards" \| "restrictions" \| "knowledge" \| "shortcuts" \| "commands" \| "guards" \| "params" \| "skills" \| "local" \| "agents" \| "workflows" \| "prompts" \| "examples" \| "hooks" \| "mcpServers" \| "plugins"

Defined in: [core/src/types/constants.ts:93](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/constants.ts#L93)

Check if a string is a known block type.

## Parameters

### name

`string`

String to check

## Returns

name is "identity" \| "context" \| "standards" \| "restrictions" \| "knowledge" \| "shortcuts" \| "commands" \| "guards" \| "params" \| "skills" \| "local" \| "agents" \| "workflows" \| "prompts" \| "examples" \| "hooks" \| "mcpServers" \| "plugins"

True if the name is a known block type