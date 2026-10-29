# normalizeDenyText()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: normalizeDenyText()

> **normalizeDenyText**(`text`): `string`

Defined in: [validator/src/policy/content-rules.ts:35](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/validator/src/policy/content-rules.ts#L35)

Normalize text for `deny` matching: NFKC, default-ignorable code points
removed, whitespace collapsed, lowercase. It catches plain variants of a
phrase, not a determined author.

## Parameters

### text

`string`

## Returns

`string`