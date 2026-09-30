# getMinimumVersionForFeature()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getMinimumVersionForFeature()

> **getMinimumVersionForFeature**(`feature`): `string` \| `undefined`

Defined in: [core/src/syntax-versions.ts:220](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/syntax-versions.ts#L220)

Get the minimum syntax version that supports a non-block feature.

## Parameters

### feature

[`SyntaxFeature`](https://getpromptscript.dev/api-reference/core/src/type-aliases/SyntaxFeature/index.md)

## Returns

`string` \| `undefined`

Version string, or undefined if the feature is not registered