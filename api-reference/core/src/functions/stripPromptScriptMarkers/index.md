# stripPromptScriptMarkers()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: stripPromptScriptMarkers()

> **stripPromptScriptMarkers**(`content`): `string`

Defined in: [core/src/utils/markers.ts:28](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/utils/markers.ts#L28)

Strip all PromptScript generation markers from content.

Used to compare generated output against a file on disk while ignoring
timestamp-only differences.

RegExp objects are created per call to avoid a stateful module-level `g`
pattern (which maintains a `lastIndex` cursor between calls).

## Parameters

### content

`string`

File content that may contain markers

## Returns

`string`

Content without marker lines