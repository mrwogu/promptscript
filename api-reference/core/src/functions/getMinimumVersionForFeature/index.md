# getMinimumVersionForFeature()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getMinimumVersionForFeature()

> **getMinimumVersionForFeature**(`feature`): `string` \| `undefined`

Defined in: [core/src/syntax-versions.ts:262](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/syntax-versions.ts#L262)

Get the minimum syntax version that supports a non-block feature.

## Parameters

### feature

[`SyntaxFeature`](https://getpromptscript.dev/api-reference/core/src/type-aliases/SyntaxFeature/index.md)

## Returns

`string` \| `undefined`

Version string, or undefined if the feature is not registered