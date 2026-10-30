# skillNameFromPath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: skillNameFromPath()

> **skillNameFromPath**(`filePath`): `string`

Defined in: [resolver/src/skills.ts:191](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/resolver/src/skills.ts#L191)

Derive a skill name from a file path by stripping the .md extension.

## Parameters

### filePath

`string`

Absolute or relative path to a .md file

## Returns

`string`

The filename without the .md extension