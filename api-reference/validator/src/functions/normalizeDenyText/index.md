# normalizeDenyText()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: normalizeDenyText()

> **normalizeDenyText**(`text`): `string`

Defined in: [validator/src/policy/content-rules.ts:35](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/validator/src/policy/content-rules.ts#L35)

Normalize text for `deny` matching: NFKC, default-ignorable code points
removed, whitespace collapsed, lowercase. It catches plain variants of a
phrase, not a determined author.

## Parameters

### text

`string`

## Returns

`string`