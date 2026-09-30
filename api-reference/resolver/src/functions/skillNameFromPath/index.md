# skillNameFromPath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: skillNameFromPath()

> **skillNameFromPath**(`filePath`): `string`

Defined in: [resolver/src/skills.ts:191](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/skills.ts#L191)

Derive a skill name from a file path by stripping the .md extension.

## Parameters

### filePath

`string`

Absolute or relative path to a .md file

## Returns

`string`

The filename without the .md extension