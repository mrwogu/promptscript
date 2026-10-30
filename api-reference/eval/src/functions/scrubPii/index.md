# scrubPii()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: scrubPii()

> **scrubPii**(`text`): `object`

Defined in: [eval/src/dataset/pii.ts:254](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/dataset/pii.ts#L254)

Replace the personal data [detectPii](https://getpromptscript.dev/api-reference/eval/src/functions/detectPii/index.md) finds in one value with `[email]`,
`[card]` or `[iban]`. It uses the same detectors, so it finds what the
scan finds and nothing more: names, phone numbers, postal addresses and ids
in free text stay. It passes over the text in the order email, IBAN, card until
nothing is left to replace (at most four rounds), so a card-like run inside an address or an
IBAN goes with it and a value that stood next to a replaced one is found. Run `detectPii` on
the result to catch a bug in the replacer.

## Parameters

### text

`string`

One string value

## Returns

`object`

The scrubbed text and how many values of each kind were replaced

### counts

> **counts**: [`ScrubCounts`](https://getpromptscript.dev/api-reference/eval/src/interfaces/ScrubCounts/index.md)

### text

> **text**: `string`