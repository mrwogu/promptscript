# stripLeadingHtmlMarker()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: stripLeadingHtmlMarker()

> **stripLeadingHtmlMarker**(`body`): `string`

Defined in: [core/src/utils/markers.ts:79](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/utils/markers.ts#L79)

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