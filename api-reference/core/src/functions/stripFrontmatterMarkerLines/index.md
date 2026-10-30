# stripFrontmatterMarkerLines()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: stripFrontmatterMarkerLines()

> **stripFrontmatterMarkerLines**(`frontmatter`): `string`

Defined in: [core/src/utils/markers.ts:62](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/utils/markers.ts#L62)

Remove PromptScript YAML marker lines from raw YAML frontmatter.

Generated files carry the marker as the first frontmatter line. When such a
file is re-ingested as a skill source, the stale marker must not be passed
through to the next compilation output.

## Parameters

### frontmatter

`string`

Raw frontmatter block (without the `---` delimiters)

## Returns

`string`

Frontmatter without PromptScript marker lines