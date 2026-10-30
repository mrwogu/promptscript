# normalizeDenyText()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: normalizeDenyText()

> **normalizeDenyText**(`text`): `string`

Defined in: [validator/src/policy/content-rules.ts:35](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/validator/src/policy/content-rules.ts#L35)

Normalize text for `deny` matching: NFKC, default-ignorable code points
removed, whitespace collapsed, lowercase. It catches plain variants of a
phrase, not a determined author.

## Parameters

### text

`string`

## Returns

`string`