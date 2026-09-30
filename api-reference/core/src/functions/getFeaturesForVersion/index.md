# getFeaturesForVersion()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getFeaturesForVersion()

> **getFeaturesForVersion**(`version`): readonly [`SyntaxFeature`](https://getpromptscript.dev/api-reference/core/src/type-aliases/SyntaxFeature/index.md)[] \| `undefined`

Defined in: [core/src/syntax-versions.ts:198](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/syntax-versions.ts#L198)

Get the list of non-block syntax features for a known syntax version.

## Parameters

### version

`string`

## Returns

readonly [`SyntaxFeature`](https://getpromptscript.dev/api-reference/core/src/type-aliases/SyntaxFeature/index.md)[] \| `undefined`

Feature list, or undefined if version is unknown