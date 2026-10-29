# skillNameFromPath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: skillNameFromPath()

> **skillNameFromPath**(`filePath`): `string`

Defined in: [resolver/src/skills.ts:191](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/resolver/src/skills.ts#L191)

Derive a skill name from a file path by stripping the .md extension.

## Parameters

### filePath

`string`

Absolute or relative path to a .md file

## Returns

`string`

The filename without the .md extension