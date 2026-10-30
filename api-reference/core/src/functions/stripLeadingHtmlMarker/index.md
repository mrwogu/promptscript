# stripLeadingHtmlMarker()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: stripLeadingHtmlMarker()

> **stripLeadingHtmlMarker**(`body`): `string`

Defined in: [core/src/utils/markers.ts:79](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/utils/markers.ts#L79)

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