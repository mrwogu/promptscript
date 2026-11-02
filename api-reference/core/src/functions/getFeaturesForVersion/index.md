# getFeaturesForVersion()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getFeaturesForVersion()

> **getFeaturesForVersion**(`version`): readonly [`SyntaxFeature`](https://getpromptscript.dev/api-reference/core/src/type-aliases/SyntaxFeature/index.md)[] \| `undefined`

Defined in: [core/src/syntax-versions.ts:240](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/syntax-versions.ts#L240)

Get the list of non-block syntax features for a known syntax version.

## Parameters

### version

`string`

## Returns

readonly [`SyntaxFeature`](https://getpromptscript.dev/api-reference/core/src/type-aliases/SyntaxFeature/index.md)[] \| `undefined`

Feature list, or undefined if version is unknown