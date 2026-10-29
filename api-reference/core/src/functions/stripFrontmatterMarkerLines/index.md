# stripFrontmatterMarkerLines()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: stripFrontmatterMarkerLines()

> **stripFrontmatterMarkerLines**(`frontmatter`): `string`

Defined in: [core/src/utils/markers.ts:62](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/utils/markers.ts#L62)

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