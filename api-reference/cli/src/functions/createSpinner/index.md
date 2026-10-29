# createSpinner()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: createSpinner()

> **createSpinner**(`text`): `Ora`

Defined in: [cli/src/output/console.ts:90](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/output/console.ts#L90)

Creates a spinner for async operations.
Returns a no-op spinner in quiet mode.

## Parameters

### text

`string`

Initial text to display.

## Returns

`Ora`

An ora spinner instance.