# stripLeadingHtmlMarker()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: stripLeadingHtmlMarker()

> **stripLeadingHtmlMarker**(`body`): `string`

Defined in: [core/src/utils/markers.ts:79](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/utils/markers.ts#L79)

Remove a leading PromptScript HTML marker from a markdown body.

Only a marker at the very top of the body is removed, so markers documented
inside prose are preserved.

## Parameters

### body

`string`

Markdown body content

## Returns

`string`

Body without a leading marker line