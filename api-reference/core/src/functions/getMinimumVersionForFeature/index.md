# getMinimumVersionForFeature()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getMinimumVersionForFeature()

> **getMinimumVersionForFeature**(`feature`): `string` \| `undefined`

Defined in: [core/src/syntax-versions.ts:262](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/syntax-versions.ts#L262)

Get the minimum syntax version that supports a non-block feature.

## Parameters

### feature

[`SyntaxFeature`](https://getpromptscript.dev/api-reference/core/src/type-aliases/SyntaxFeature/index.md)

## Returns

`string` \| `undefined`

Version string, or undefined if the feature is not registered