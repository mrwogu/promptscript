# getFeaturesForVersion()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getFeaturesForVersion()

> **getFeaturesForVersion**(`version`): readonly [`SyntaxFeature`](https://getpromptscript.dev/api-reference/core/src/type-aliases/SyntaxFeature/index.md)[] \| `undefined`

Defined in: [core/src/syntax-versions.ts:240](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/syntax-versions.ts#L240)

Get the list of non-block syntax features for a known syntax version.

## Parameters

### version

`string`

## Returns

readonly [`SyntaxFeature`](https://getpromptscript.dev/api-reference/core/src/type-aliases/SyntaxFeature/index.md)[] \| `undefined`

Feature list, or undefined if version is unknown